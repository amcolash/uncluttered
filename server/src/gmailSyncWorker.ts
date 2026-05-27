import { google } from 'googleapis';

import { db } from './db.ts';
import type { Email } from './db.ts';
import { getAuthClient } from './gmailAuth.ts';
import { classifyEmail } from './ollamaService.ts';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS = 50;

async function syncEmails(): Promise<void> {
  console.log('[GmailSync] Starting sync...');

  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Step A: List unread inbox messages
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread label:INBOX',
      maxResults: MAX_RESULTS,
    });

    const messages = listRes.data.messages ?? [];

    if (messages.length === 0) {
      console.log('[GmailSync] No unread messages found.');
      return;
    }

    // Step B: Filter to IDs not already in the local cache
    const existingIds = new Set(db.data.emails.map((e) => e.id));
    const newMessages = messages.filter((m) => m.id != null && !existingIds.has(m.id));

    if (newMessages.length === 0) {
      console.log('[GmailSync] All unread messages already cached.');
      return;
    }

    console.log(`[GmailSync] Fetching metadata for ${newMessages.length} new message(s) in parallel...`);

    // Step C: Fetch all metadata headers in parallel — lightweight network I/O,
    // safe to parallelize. Failed individual fetches are filtered out rather than
    // aborting the whole batch.
    const metadataResults = await Promise.allSettled(
      newMessages
        .filter((m) => m.id != null)
        .map((msg) =>
          gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject'],
          })
        )
    );

    // Step D: Classify each message sequentially with Ollama to avoid saturating
    // the 2-core NAS, then push all results into Lowdb and do a single write.
    let saved = 0;

    for (const result of metadataResults) {
      if (result.status === 'rejected') {
        console.error('[GmailSync] Failed to fetch message metadata:', result.reason);
        continue;
      }

      const detail = result.value;
      const id = detail.data.id;
      if (!id) continue;

      try {
        const headers = detail.data.payload?.headers ?? [];
        const getHeader = (name: string): string =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

        const sender = getHeader('From');
        const subject = getHeader('Subject');
        const snippet = detail.data.snippet ?? '';
        const threadId = detail.data.threadId ?? '';

        const aiCategory = await classifyEmail(subject, snippet);

        const email: Email = {
          id,
          threadId,
          sender,
          subject,
          snippet,
          aiCategory,
          userOverrideCategory: null,
          isArchived: false,
          processedAt: new Date().toISOString(),
        };

        db.data.emails.push(email);
        saved++;
        console.log(`[GmailSync] Classified: "${subject}" → ${aiCategory}`);
      } catch (err) {
        console.error(`[GmailSync] Failed to classify message ${id}:`, err);
      }
    }

    if (saved > 0) {
      await db.write();
      console.log(`[GmailSync] Sync complete — saved ${saved} message(s).`);
    } else {
      console.log('[GmailSync] Sync complete — no new messages saved.');
    }
  } catch (err) {
    console.error('[GmailSync] Sync error:', err);
  }
}

export function startGmailSyncWorker(): void {
  // Run once immediately on startup, then repeat on the configured interval
  syncEmails();
  setInterval(syncEmails, SYNC_INTERVAL_MS);
  console.log(`[GmailSync] Worker started — syncing every ${SYNC_INTERVAL_MS / 60_000} minute(s).`);
}
