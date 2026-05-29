import { gmail_v1, google } from 'googleapis';

import { db } from './db.ts';
import type { Email } from './dbTypes.ts';
import { classifyEmail } from './emailClassifier.ts';
import { getAuthClient } from './gmailAuth.ts';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EMAILS = 3000;
const PAGE_SIZE = 500; // Gmail API hard cap per request

async function syncEmails(): Promise<void> {
  console.log('[GmailSync] Starting sync...');

  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Step A: Page through the inbox (max 500/request) until we have MAX_EMAILS
    // or run out of results.
    const allMessages: { id?: string | null }[] = [];
    let pageToken: string | undefined;

    do {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'label:INBOX is:unread',
        maxResults: PAGE_SIZE,
        pageToken,
      });
      allMessages.push(...(listRes.data.messages ?? []));
      pageToken = listRes.data.nextPageToken ?? undefined;
    } while (pageToken && allMessages.length < MAX_EMAILS);

    const messages = allMessages.slice(0, MAX_EMAILS);

    if (messages.length === 0) {
      console.log('[GmailSync] No messages found.');
      return;
    }

    // Step B: Filter to IDs not already in the local cache
    const existingIds = new Set(db.data.emails.map((e) => e.id));
    const newMessages = messages.filter((m) => m.id != null && !existingIds.has(m.id));

    // Step C: Update status of cached messages that are missing from Inbox results
    const missingIds = existingIds.size > 0 ? [...existingIds].filter((id) => !messages.some((m) => m.id === id)) : [];
    const missingCount = missingIds
      .map((id) => db.data.emails.find((e) => e.id === id))
      .filter((e) => e?.status === 'inbox').length;

    if (missingCount > 0) {
      console.warn(`[GmailSync] Warning: ${missingCount} cached message(s) not found in Gmail API results.`);

      type MessageResult =
        | { id: string; status: 'fulfilled'; data: gmail_v1.Schema$Message }
        | { id: string; status: 'rejected'; error: any };
      const missingPromises: Promise<MessageResult>[] = [];

      // Wrap the promises to return the ID alongside the result/error
      for (const id of missingIds) {
        const email = db.data.emails.find((e) => e.id === id);
        if (email && email.status === 'inbox') {
          const promise = gmail.users.messages
            .get({ userId: 'me', id })
            .then((response) => ({ id, status: 'fulfilled', data: response.data }) as MessageResult)
            .catch((error) => ({ id, status: 'rejected', error }) as MessageResult);

          missingPromises.push(promise);
        }
      }

      // Use Promise.all to fetch metadata in parallel
      const results = await Promise.all(missingPromises);

      results.forEach((result) => {
        const email = db.data.emails.find((e) => e.id === result.id);
        if (!email) return;

        if (result.status === 'fulfilled') {
          const labels = result.data.labelIds ?? [];

          if (labels.includes('TRASH')) {
            email.status = 'deleted';
            console.log(`[GmailSync] Message ${result.id} marked as deleted (in TRASH).`);
          } else if (!labels.includes('INBOX')) {
            email.status = 'archived';
            console.log(`[GmailSync] Message ${result.id} marked as archived.`);
          }
        } else {
          // Handle the error case and explicitly check for a 404
          const err = result.error;

          // Google API errors usually expose the status code on err.code or err.response.status
          const statusCode = err.code || err.status || (err.response && err.response.status);

          if (statusCode === 404) {
            email.status = 'deleted';
            console.log(`[GmailSync] Message ${result.id} marked as deleted (404).`);
          } else {
            // Do NOT change the DB status if it's a 500, 429, or network error
            console.error(`[GmailSync] Failed to fetch missing message ${result.id}:`, err.message);
          }
        }
      });

      await db.write();
    }

    // Step D: Fetch all metadata headers in parallel — lightweight network I/O,
    // safe to parallelize. Failed individual fetches are filtered out rather than
    // aborting the whole batch.
    console.log(`[GmailSync] Fetching metadata for ${newMessages.length} new message(s) in parallel...`);

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

    if (newMessages.length === 0 && missingCount === 0) {
      console.log('[GmailSync] All messages already cached.');
      return;
    }

    // Step D: Classify each message sequentially with ML model to avoid saturating
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

        const { category: aiCategory } = await classifyEmail(subject, snippet, sender);

        const email: Email = {
          id,
          threadId,
          sender,
          subject,
          snippet,
          aiCategory,
          userOverrideCategory: null,
          status: 'inbox',
          processedAt: new Date().toISOString(),
          validated: false,
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
