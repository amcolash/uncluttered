import { gmail_v1, google } from 'googleapis';

import { db } from './db.ts';
import type { Email } from './dbTypes.ts';
import { classifyEmail } from './emailClassifier.ts';
import { getAuthClient } from './gmailAuth.ts';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EMAILS = 3000;
const PAGE_SIZE = 500; // Gmail API hard cap per request
const BATCH_CONCURRENCY = 5;
const BATCH_CHUNK_SIZE = 25;
const MAX_NEW_EMAILS_PER_SYNC = 500;
const DELAY_BETWEEN_BATCHES_MS = 250;

let isSyncRunning = false;
let rateLimitPausedUntil = 0;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitError(err: any): boolean {
  const status = err?.status ?? err?.code ?? err?.response?.status;
  if (status === 429) return true;
  if (status === 403) {
    const msg = (err?.message || err?.cause?.message || err?.response?.data?.error?.message || '').toLowerCase();
    const reason = (err?.response?.data?.error?.errors?.[0]?.reason || '').toLowerCase();
    if (
      msg.includes('quota exceeded') ||
      msg.includes('rate limit') ||
      msg.includes('user rate') ||
      msg.includes('units per minute') ||
      reason.includes('ratelimit') ||
      reason.includes('quota') ||
      reason.includes('rate_limit')
    ) {
      return true;
    }
  }
  return false;
}

export async function waitForRateLimitPause(): Promise<void> {
  const now = Date.now();
  if (rateLimitPausedUntil > now) {
    const waitMs = rateLimitPausedUntil - now;
    const jitter = Math.random() * 2000;
    console.warn(`[GmailSync] Rate limit active. Pausing requests for ${((waitMs + jitter) / 1000).toFixed(1)}s...`);
    await sleep(waitMs + jitter);
  }
}

export function pauseForRateLimit(durationMs = 30_000) {
  const newUntil = Date.now() + durationMs;
  if (newUntil > rateLimitPausedUntil) {
    rateLimitPausedUntil = newUntil;
    console.warn(`[GmailSync] Rate limit hit. Pausing all Gmail requests for ${(durationMs / 1000).toFixed(1)}s.`);
  }
}

export async function callWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 5,
  initialDelayMs = 2000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    await waitForRateLimitPause();

    try {
      return await operation();
    } catch (err: any) {
      attempt++;

      if (isRateLimitError(err)) {
        pauseForRateLimit(Math.max(delay * 2, 30_000));
        if (attempt <= maxRetries) {
          const jitter = Math.random() * 1000;
          const waitTime = delay + jitter;
          console.warn(
            `[GmailSync] Rate limited on ${context}. Retry ${attempt}/${maxRetries} after ${(waitTime / 1000).toFixed(1)}s...`
          );
          await sleep(waitTime);
          delay = Math.min(delay * 2, 60_000);
          continue;
        }
      }

      // Check for transient 5xx errors
      const status = err?.status ?? err?.code ?? err?.response?.status;
      if (typeof status === 'number' && status >= 500 && status < 600 && attempt <= maxRetries) {
        const waitTime = delay + Math.random() * 500;
        console.warn(
          `[GmailSync] Server error (${status}) on ${context}. Retry ${attempt}/${maxRetries} after ${(waitTime / 1000).toFixed(1)}s...`
        );
        await sleep(waitTime);
        delay = Math.min(delay * 2, 30_000);
        continue;
      }

      throw err;
    }
  }
}

function parseEmailDate(internalDate?: string | null, dateHeader?: string | null): string {
  if (internalDate && !isNaN(Number(internalDate)) && Number(internalDate) > 0) {
    return new Date(Number(internalDate)).toISOString();
  }
  if (dateHeader) {
    const parsed = Date.parse(dateHeader);
    if (!isNaN(parsed) && parsed > 0) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
  delayBetweenBatchesMs = DELAY_BETWEEN_BATCHES_MS
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length && delayBetweenBatchesMs > 0) {
      await sleep(delayBetweenBatchesMs);
    }
  }
  return results;
}

export async function getGmailApi() {
  const auth = await getAuthClient();
  return google.gmail({ version: 'v1', auth });
}

async function fetchMissingData(): Promise<void> {
  const gmail = await getGmailApi();

  const missingEmails = db.data.emails.filter((email) => !email.date || email.date === '1970-01-01T00:00:00.000Z');

  if (missingEmails.length === 0) return;

  console.log(`[GmailSync] Fetching dates for ${missingEmails.length} message(s)...`);

  await processInBatches(missingEmails, BATCH_CONCURRENCY, async (email) => {
    try {
      const response = await callWithRetry(
        () =>
          gmail.users.messages.get({
            userId: 'me',
            id: email.id,
            format: 'metadata',
            metadataHeaders: ['Date'],
          }),
        `fetchDate(${email.id})`
      );
      const headers = response.data.payload?.headers ?? [];
      const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date');
      email.date = parseEmailDate(response.data.internalDate, dateHeader?.value);
      console.log(`[GmailSync] Updated date for message ${email.id}: ${email.date}`);
    } catch (err: any) {
      console.error(`[GmailSync] Failed to fetch date for message ${email.id}:`, err?.message || err);
    }
  });

  await db.write();
}

export async function syncEmails(): Promise<void> {
  if (isSyncRunning) {
    console.log('[GmailSync] Sync already in progress, skipping duplicate run.');
    return;
  }

  isSyncRunning = true;
  console.log('[GmailSync] Starting sync...');

  try {
    const gmail = await getGmailApi();

    // Step A: Page through the inbox (max 500/request) until we have MAX_EMAILS
    // or run out of results.
    const allMessages: { id?: string | null }[] = [];
    let pageToken: string | undefined;

    do {
      const listRes = await callWithRetry(
        () =>
          gmail.users.messages.list({
            userId: 'me',
            q: 'label:INBOX',
            maxResults: PAGE_SIZE,
            pageToken,
          }),
        'listInboxMessages'
      );
      allMessages.push(...(listRes.data.messages ?? []));
      pageToken = listRes.data.nextPageToken ?? undefined;
      if (pageToken) {
        await sleep(300);
      }
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
    // or that were previously deleted/archived but now appear in Inbox (untrashed)
    const missingIds = existingIds.size > 0 ? [...existingIds].filter((id) => !messages.some((m) => m.id === id)) : [];
    const gmailIds = new Set(messages.map((m) => m.id));

    // Check for emails that were deleted/archived but are now back in INBOX (untrashed)
    const restoredIds = [...existingIds].filter((id) => {
      const email = db.data.emails.find((e) => e.id === id);
      return email && email.status !== 'inbox' && gmailIds.has(id);
    });

    const activeMissingIds = missingIds.filter((id) => {
      const email = db.data.emails.find((e) => e.id === id);
      return email && email.status === 'inbox';
    });

    if (activeMissingIds.length > 0 || restoredIds.length > 0) {
      if (activeMissingIds.length > 0) {
        console.log(`[GmailSync] Checking status for ${activeMissingIds.length} missing message(s)...`);
      }

      if (restoredIds.length > 0) {
        // For restored emails, simply update their status back to 'inbox'
        restoredIds.forEach((id) => {
          const email = db.data.emails.find((e) => e.id === id);
          if (email) {
            console.log(`[GmailSync] Message ${id} restored to inbox (was: ${email.status}).`);
            email.status = 'inbox';
          }
        });

        console.log(`[GmailSync] Restored ${restoredIds.length} message(s) back in INBOX.`);
      }

      // Efficiently check which missing messages are in TRASH using a single list query
      // instead of hundreds of individual messages.get calls.
      const trashIds = new Set<string>();
      try {
        let trashPageToken: string | undefined;
        do {
          const trashListRes = await callWithRetry(
            () =>
              gmail.users.messages.list({
                userId: 'me',
                q: 'label:TRASH',
                maxResults: PAGE_SIZE,
                pageToken: trashPageToken,
              }),
            'listTrashMessages'
          );
          for (const m of trashListRes.data.messages ?? []) {
            if (m.id) trashIds.add(m.id);
          }
          trashPageToken = trashListRes.data.nextPageToken ?? undefined;
          if (trashIds.size >= 1000) break;
        } while (trashPageToken);
      } catch (err) {
        console.error('[GmailSync] Failed to list trash messages:', err);
      }

      let trashedCount = 0;
      let archivedCount = 0;

      for (const id of activeMissingIds) {
        const email = db.data.emails.find((e) => e.id === id);
        if (!email) continue;

        if (trashIds.has(id)) {
          email.status = 'deleted';
          trashedCount++;
        } else {
          email.status = 'archived';
          archivedCount++;
        }
      }

      console.log(
        `[GmailSync] Missing messages resolved: ${trashedCount} marked as deleted (TRASH), ${archivedCount} marked as archived.`
      );
      await db.write();
    }

    // Step D: For any messages missing dates, fetch those before classification
    await fetchMissingData();

    if (newMessages.length === 0) {
      console.log('[GmailSync] All messages already cached.');
      return;
    }

    const messagesToProcess = newMessages.slice(0, MAX_NEW_EMAILS_PER_SYNC);
    if (newMessages.length > MAX_NEW_EMAILS_PER_SYNC) {
      console.log(
        `[GmailSync] ${newMessages.length} new messages found. Processing first ${MAX_NEW_EMAILS_PER_SYNC} in this run; remaining will sync in subsequent cycles.`
      );
    }

    console.log(
      `[GmailSync] Fetching & classifying ${messagesToProcess.length} new message(s) in paced batches of ${BATCH_CHUNK_SIZE}...`
    );

    let totalSaved = 0;

    for (let i = 0; i < messagesToProcess.length; i += BATCH_CHUNK_SIZE) {
      const chunk = messagesToProcess.slice(i, i + BATCH_CHUNK_SIZE);
      const batchNum = Math.floor(i / BATCH_CHUNK_SIZE) + 1;
      const totalBatches = Math.ceil(messagesToProcess.length / BATCH_CHUNK_SIZE);

      console.log(`[GmailSync] Fetching metadata for batch ${batchNum}/${totalBatches} (${chunk.length} emails)...`);

      const metadataResults = await processInBatches(
        chunk,
        BATCH_CONCURRENCY,
        async (msg) => {
          try {
            const res = await callWithRetry(
              () =>
                gmail.users.messages.get({
                  userId: 'me',
                  id: msg.id!,
                  format: 'metadata',
                  metadataHeaders: ['From', 'Subject', 'Date'],
                }),
              `metadata(${msg.id})`
            );
            return { status: 'fulfilled' as const, value: res };
          } catch (err) {
            return { status: 'rejected' as const, reason: err };
          }
        },
        50
      );

      let chunkSaved = 0;

      for (const result of metadataResults) {
        if (result.status === 'rejected') {
          console.error(
            '[GmailSync] Failed to fetch message metadata:',
            (result.reason as any)?.message || result.reason
          );
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
            date: parseEmailDate(detail.data.internalDate, getHeader('Date')),
            processedAt: new Date().toISOString(),
            validated: false,
            important: false,
          };

          db.data.emails.push(email);
          chunkSaved++;
          totalSaved++;
          console.log(
            `[GmailSync] Classified [${totalSaved}/${messagesToProcess.length}]: "${subject}" → ${aiCategory}`
          );
        } catch (err) {
          console.error(`[GmailSync] Failed to classify message ${id}:`, err);
        }
      }

      if (chunkSaved > 0) {
        await db.write();
        console.log(`[GmailSync] Saved batch ${batchNum}/${totalBatches} (${chunkSaved} emails written to DB).`);
      }

      if (i + BATCH_CHUNK_SIZE < messagesToProcess.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    console.log(`[GmailSync] Sync complete — saved ${totalSaved} new message(s).`);
  } catch (err: any) {
    console.error('[GmailSync] Sync error:', err?.message || err);
  } finally {
    isSyncRunning = false;
  }
}

export function startGmailSyncWorker(): void {
  // Run once immediately on startup, then repeat on the configured interval
  syncEmails();
  setInterval(syncEmails, SYNC_INTERVAL_MS);
  console.log(`[GmailSync] Worker started — syncing every ${SYNC_INTERVAL_MS / 60_000} minute(s).`);
}
