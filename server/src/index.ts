import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';
import { gmail_v1 } from 'googleapis';
import { simpleParser } from 'mailparser';

import { db } from './db.ts';
import type { Email } from './dbTypes.ts';
import { classifyEmail } from './emailClassifier.ts';
import { authorizeWithCode, checkAuthStatus, resetAuth } from './gmailAuth.ts';
import { callWithRetry, getGmailApi, startGmailSyncWorker, syncEmails } from './gmailSyncWorker.ts';
import { createBackup, ensureDailyBackup, initScheduler } from './scheduler.ts';

const IS_DOCKER = existsSync('/.dockerenv');

const app = express();
const port = 7001;

app.use(cors());
app.use(express.json());

// ── Auto-retrain state ───────────────────────────────────────────────────────

const AUTO_RETRAIN_THRESHOLD = 20;
let sessionOverrideCount = 0;

async function triggerRetrain() {
  const examples = db.data.emails
    .filter((e) => {
      const cat = e.userOverrideCategory ?? e.aiCategory;
      return cat && cat !== 'UNKNOWN';
    })
    .map((e) => ({
      subject: e.subject,
      snippet: e.snippet,
      sender: e.sender,
      category: (e.userOverrideCategory ?? e.aiCategory) as string,
      isGold: Boolean(e.userOverrideCategory || e.validated),
    }));

  try {
    const response = await fetch('http://localhost:7002/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examples }),
      signal: AbortSignal.timeout(30_000),
    });
    const result = (await response.json()) as Record<string, unknown>;
    console.log('[Auto-retrain] Complete:', result);
  } catch (err) {
    console.error('[Auto-retrain] Failed:', err);
  }
}

async function archiveEmail(gmail: gmail_v1.Gmail, email: Email) {
  try {
    console.log(`[Archive] ${email.subject} (${email.id})`);

    await callWithRetry(
      () =>
        gmail.users.messages.modify({
          userId: 'me',
          id: email.id,
          requestBody: {
            removeLabelIds: ['INBOX'],
          },
        }),
      `archive(${email.id})`
    );

    email.status = 'archived';
    await db.write();
  } catch (err) {
    console.error(`[Archive] Failed to archive email ${email.id}:`, err);
    throw err;
  }
}

async function deleteEmail(gmail: gmail_v1.Gmail, email: Email) {
  try {
    console.log(`[Delete] ${email.subject} (${email.id})`);

    await callWithRetry(
      () =>
        gmail.users.messages.trash({
          userId: 'me',
          id: email.id,
        }),
      `trash(${email.id})`
    );

    email.status = 'deleted';
    await db.write();
  } catch (err) {
    console.error(`[Delete] Failed to delete email ${email.id}:`, err);
    throw err;
  }
}

async function batchProcessEmails(
  ids: string[],
  operation: (gmail: gmail_v1.Gmail, email: Email) => Promise<void>,
  operationName: string
) {
  console.log(`[Batch ${operationName}] Processing ${ids.length} emails...`);

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('ids must be a non-empty array');
  }

  const gmail = await getGmailApi();
  const results = { success: [] as string[], failed: [] as { id: string; error: string }[] };

  for (const id of ids) {
    const email = db.data.emails.find((e) => e.id === id);
    if (!email) {
      results.failed.push({ id, error: 'Email not found' });
      continue;
    }

    try {
      await operation(gmail, email);
      results.success.push(id);
    } catch (err) {
      results.failed.push({ id, error: String(err) });
    }
  }

  return results;
}

// ── Auth endpoints ──────────────────────────────────────────────────────────

app.get('/api/auth/status', async (_req, res) => {
  try {
    const status = await checkAuthStatus();
    res.json(status);
  } catch (err) {
    console.error('[Auth] Failed to check status:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/auth/reset', async (_req, res) => {
  try {
    const result = await resetAuth();
    res.json(result);
  } catch (err) {
    console.error('[Auth] Failed to reset auth:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const redirectBase = IS_DOCKER ? '' : 'http://localhost:5173';

  if (error) {
    console.error('[Auth] Authorization denied by user or Google:', error);
    res.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent(`Authorization denied: ${error}`)}`);
    return;
  }

  if (!code) {
    res.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent('No authorization code received.')}`);
    return;
  }

  try {
    await authorizeWithCode(code);
    // Run sync in the background so redirect responds immediately without browser timeout
    syncEmails().catch((err) => console.error('[GmailSync] Post-auth sync failed:', err));
    res.redirect(`${redirectBase}/?auth=success`);
  } catch (err: any) {
    console.error('[Auth] Failed to authorize with code:', err);
    res.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent(err?.message || 'Authorization failed')}`);
  }
});

// ── Email endpoints ─────────────────────────────────────────────────────────

/** Returns all non-archived emails (the main triage feed). */
app.get('/api/emails', (_req, res) => {
  const emails = db.data.emails.filter((e) => e.status === 'inbox');
  res.json(emails);
});

function handleApiError(res: express.Response, err: unknown, fallbackMessage = 'An error occurred') {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('[GmailAuth]')) {
    res.status(401).json({ error: message, authRequired: true });
    return;
  }
  res.status(500).json({ error: message || fallbackMessage });
}

app.get('/api/emails/:id', async (req, res) => {
  try {
    const gmail = await getGmailApi();
    const response = await callWithRetry(
      () =>
        gmail.users.messages.get({
          userId: 'me',
          id: req.params.id,
          format: 'raw',
        }),
      `getEmailRaw(${req.params.id})`
    );

    // Gmail uses base64url encoding, so decode it to a standard buffer
    const rawEmailBuffer = Buffer.from(response.data.raw!, 'base64url');
    const email = await simpleParser(rawEmailBuffer);

    res.json({ html: email.html || email.textAsHtml });
  } catch (err) {
    console.error(`[Get Email] Failed to fetch email ${req.params.id}:`, err);
    handleApiError(res, err, 'Failed to fetch email details');
  }
});

/**
 * Archives an email - both in local db and via gmail api.
 * "Archiving" is simply removing the 'INBOX' label from the message.
 */
app.post('/api/emails/:id/archive', async (req, res) => {
  try {
    const results = await batchProcessEmails([req.params.id], archiveEmail, 'Archive');
    if (results.failed.length > 0) {
      res.status(404).json({ error: results.failed[0].error });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.delete('/api/emails/:id', async (req, res) => {
  try {
    const results = await batchProcessEmails([req.params.id], deleteEmail, 'Delete');
    if (results.failed.length > 0) {
      res.status(404).json({ error: results.failed[0].error });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    handleApiError(res, err);
  }
});

/** Sync emails */
app.post('/api/emails/sync', async (req, res) => {
  try {
    await syncEmails();
    res.json({ success: true });
  } catch (err) {
    console.error('[Sync] Error syncing emails:', err);
    handleApiError(res, err);
  }
});

/**
 * Batch archive multiple emails - accepts an array of email IDs
 */
app.post('/api/emails/batch/archive', async (req, res) => {
  const { ids } = req.body as { ids?: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array' });
    return;
  }

  try {
    const results = await batchProcessEmails(ids, archiveEmail, 'Archive');
    res.json(results);
  } catch (err) {
    handleApiError(res, err);
  }
});

/**
 * Batch delete multiple emails - accepts an array of email IDs
 */
app.post('/api/emails/batch/delete', async (req, res) => {
  const { ids } = req.body as { ids?: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array' });
    return;
  }

  try {
    const results = await batchProcessEmails(ids, deleteEmail, 'Delete');
    res.json(results);
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post('/api/emails/:id/important', async (req, res) => {
  const email = db.data.emails.find((e) => e.id === req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  const { important } = req.body as { important?: boolean };
  email.important = important !== undefined ? Boolean(important) : !email.important;
  await db.write();
  res.json({ success: true, important: email.important });
});

// ── Category endpoints ───────────────────────────────────────────────────────

/** Returns the current list of allowed categories. */
app.get('/api/categories', (_req, res) => {
  res.json(db.data.categories);
});

/**
 * Returns only categories that are actively assigned to at least one email
 * (via aiCategory or userOverrideCategory).
 */
app.get('/api/categories/active', (_req, res) => {
  const usedKeys = new Set(db.data.emails.flatMap((e) => [e.userOverrideCategory ?? e.aiCategory]));
  const active = db.data.categories.filter((c) => usedKeys.has(c.key));
  res.json(active);
});

// ── Reclassify endpoints ─────────────────────────────────────────────────────

/** [Debug] Classify arbitrary input data outside of db */
app.post('/api/classify', async (req, res) => {
  const { subject, snippet, sender, currentCategory } = req.body as {
    subject: string;
    snippet: string;
    sender: string;
    currentCategory?: string;
  };

  if (!subject || !snippet || !sender) {
    res.status(400).json({ error: '"subject", "snippet", and "sender" are required in the request body' });
    return;
  }

  try {
    const result = await classifyEmail(subject, snippet, sender, currentCategory);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'Classifier service unavailable', detail: String(err) });
  }
});

/**
 * Sets userOverrideCategory and validated in one call.
 * category: string = assign a new category; null = clear the override.
 * validated: true | false | null
 * Increments the retrain counter when a real category is assigned.
 */
app.post('/api/emails/:id/categorize', async (req, res) => {
  const { category, validated } = req.body as { category?: string | null; validated: boolean };

  if (category !== null && category !== undefined) {
    const validKeys = db.data.categories.map((c) => c.key);
    if (!validKeys.includes(category)) {
      res.status(400).json({ error: 'Invalid category', validCategories: validKeys });
      return;
    }
  }

  const email = db.data.emails.find((e) => e.id === req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  if (category !== undefined) email.userOverrideCategory = category;
  email.validated = validated || false;
  await db.write();

  if (category) {
    sessionOverrideCount++;
    if (sessionOverrideCount >= AUTO_RETRAIN_THRESHOLD) {
      sessionOverrideCount = 0;
      if (IS_DOCKER) {
        console.log(`[Auto-retrain] ${AUTO_RETRAIN_THRESHOLD} overrides reached (skipped in Docker to conserve CPU).`);
      } else {
        console.log(`[Auto-retrain] ${AUTO_RETRAIN_THRESHOLD} overrides reached — retraining in background…`);
        triggerRetrain();
      }
    }
  }

  res.json({ success: true });
});

/** Run classification on all non-validated emails. Writes to db */
app.post('/api/emails/reclassify', async (_req, res) => {
  const targets = db.data.emails.filter((e) => !e.validated);

  const results = await Promise.all(
    targets.map(async (email) => {
      const { category, confidence } = await classifyEmail(email.subject, email.snippet, email.sender);
      return {
        id: email.id,
        sender: email.sender,
        subject: email.subject,
        snippet: email.snippet,
        current: { category: email.aiCategory },
        proposed: { category, confidence },
        changed: category !== email.aiCategory,
      };
    })
  );

  results.forEach((r) => {
    const email = db.data.emails.find((e) => e.id === r.id);
    if (email && r.changed) {
      email.aiCategory = r.proposed.category;
    }
  });
  await db.write();

  const changed = results.filter((r) => r.changed).length;
  res.json({ total: results.length, changed, results: results.filter((r) => r.changed) });
});

/**
 * Dry-run reclassification — runs the classifier on every non-overridden email
 * and returns a diff of current vs proposed results. Nothing is written to db.
 */
app.get('/api/emails/reclassify/preview', async (_req, res) => {
  const targets = db.data.emails.filter((e) => e.userOverrideCategory === null);

  const results = await Promise.all(
    targets.map(async (email) => {
      const { category, confidence } = await classifyEmail(email.subject, email.snippet, email.sender);
      return {
        id: email.id,
        sender: email.sender,
        subject: email.subject,
        snippet: email.snippet,
        current: { category: email.aiCategory },
        proposed: { category, confidence },
        changed: category !== email.aiCategory,
      };
    })
  );

  const changed = results.filter((r) => r.changed).length;
  res.json({
    total: results.length,
    changed,
    results: results.filter((r) => r.changed),
    raw: results.sort((a, b) => (b.proposed.confidence || 0) - (a.proposed.confidence || 0)),
  });
});

/** Reclassifies a single email and returns the updated object. */
app.post('/api/emails/:id/reclassify', async (req, res) => {
  const email = db.data.emails.find((e) => e.id === req.params.id);

  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  const { category } = await classifyEmail(email.subject, email.snippet, email.sender);
  email.aiCategory = category;
  await db.write();
  res.json(email);
});

/**
 * Validates or invalidates the AI category for an email.
 * validated: true  = swipe right (confirmed correct)
 * validated: false = swipe left (marked wrong)
 */
app.post('/api/emails/:id/validate', async (req, res) => {
  const { validated } = req.body as { validated: boolean };

  if (typeof validated !== 'boolean') {
    res.status(400).json({ error: '"validated" must be a boolean=' });
    return;
  }

  const email = db.data.emails.find((e) => e.id === req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  email.validated = validated;
  await db.write();
  res.json({ success: true });
});

/**
 * Retrains the ML classifier using all emails in db.json as training data.
 * userOverrideCategory is preferred as the ground-truth label; aiCategory
 * is used as a silver label for emails that haven't been manually corrected.
 *
 * Call this after accumulating overrides to improve the model.
 */
app.post('/api/retrain', async (_req, res) => {
  try {
    await triggerRetrain();
    res.json({ success: true });
  } catch (err) {
    res.status(503).json({ error: 'Classifier service unavailable', detail: String(err) });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

// Always create a startup backup of db.json (retains latest 10)
await createBackup('startup');
await ensureDailyBackup();

// Initialize scheduled daily backup (03:55) and retrain (04:00)
initScheduler(triggerRetrain);

startGmailSyncWorker();

// Retrain model a little after startup (skipped in Docker to conserve CPU)
if (IS_DOCKER) {
  console.log('[Startup] Running inside Docker; skipping automatic startup retrain to conserve CPU.');
} else {
  setTimeout(() => {
    console.log('Re-training model on startup with existing data…');
    triggerRetrain();
  }, 10_000);
}

// Serve production static files if available
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwPath = path.resolve(__dirname, '../../www');
if (existsSync(wwwPath)) {
  app.use(express.static(wwwPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/oauth2callback') {
      res.sendFile(path.join(wwwPath, 'index.html'));
      return;
    }
    next();
  });
}

// Graceful shutdown handling to ensure LowDB flushes to disk
const shutdown = async (signal: string) => {
  console.log(`[Server] ${signal} received. Flushing db and shutting down...`);
  try {
    await db.write();
  } catch (err) {
    console.error('[Server] Error writing db during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen(port, () => {
  console.log(`Server listening on port ${port} (Docker: ${IS_DOCKER})`);
});
