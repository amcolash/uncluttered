import cors from 'cors';
import express from 'express';

import { db } from './db.ts';
import { classifyEmail } from './emailClassifier.ts';
import { startGmailSyncWorker } from './gmailSyncWorker.ts';

const app = express();
const port = 7001;

app.use(cors());
app.use(express.json());

// ── Auto-retrain state ───────────────────────────────────────────────────────

const AUTO_RETRAIN_THRESHOLD = 5;
let sessionOverrideCount = 0;

async function triggerRetrain() {
  const examples = db.data.emails
    .filter((e) => e.userOverrideCategory ?? e.aiCategory)
    .map((e) => ({
      subject: e.subject,
      snippet: e.snippet,
      sender: e.sender,
      category: (e.userOverrideCategory ?? e.aiCategory) as string,
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

// ── Email endpoints ─────────────────────────────────────────────────────────

/** Returns all non-archived emails (the main triage feed). */
app.get('/api/emails', (_req, res) => {
  const emails = db.data.emails.filter((e) => !e.isArchived);
  res.json(emails);
});

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

/**
 * Locally archives an email (hides it from the feed).
 * Does NOT mutate the live Gmail account.
 */
app.post('/api/emails/:id/archive', async (req, res) => {
  const email = db.data.emails.find((e) => e.id === req.params.id);

  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  email.isArchived = true;
  await db.write();
  res.json({ success: true });
});

/**
 * Manually overrides the AI-assigned category for an email.
 * Validates the value against the stored category keys.
 */
app.post('/api/emails/:id/override', async (req, res) => {
  const { category } = req.body as { category?: string };

  if (!category) {
    res.status(400).json({ error: '"category" is required in the request body' });
    return;
  }

  const validKeys = db.data.categories.map((c) => c.key);
  if (!validKeys.includes(category)) {
    res.status(400).json({ error: 'Invalid category', validCategories: validKeys });
    return;
  }

  const email = db.data.emails.find((e) => e.id === req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  email.userOverrideCategory = category;
  await db.write();

  sessionOverrideCount++;
  if (sessionOverrideCount >= AUTO_RETRAIN_THRESHOLD) {
    sessionOverrideCount = 0;
    console.log(`[Auto-retrain] ${AUTO_RETRAIN_THRESHOLD} overrides reached — retraining in background…`);
    triggerRetrain();
  }

  res.json({ success: true });
});

// ── Reclassify endpoints ─────────────────────────────────────────────────────

/**
 * Sets userOverrideCategory and validated in one call.
 * category: string = assign a new category; null = clear the override.
 * validated: true | false | null
 * Increments the retrain counter when a real category is assigned.
 */
app.post('/api/emails/:id/categorize', async (req, res) => {
  const { category, validated } = req.body as { category?: string | null; validated?: boolean | null };

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
  if (validated !== undefined) email.validated = validated ?? null;
  await db.write();

  if (category) {
    sessionOverrideCount++;
    if (sessionOverrideCount >= AUTO_RETRAIN_THRESHOLD) {
      sessionOverrideCount = 0;
      console.log(`[Auto-retrain] ${AUTO_RETRAIN_THRESHOLD} overrides reached — retraining in background…`);
      triggerRetrain();
    }
  }

  res.json({ success: true });
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
  res.json({ total: results.length, changed, results: results.filter((r) => r.changed) });
});

// Classify input data outside of db
app.post('/api/classify', async (req, res) => {
  const { subject, snippet, sender } = req.body as { subject: string; snippet: string; sender: string };

  if (!subject || !snippet || !sender) {
    res.status(400).json({ error: '"subject", "snippet", and "sender" are required in the request body' });
    return;
  }

  try {
    const { category, urgency } = await classifyEmail(subject, snippet, sender);
    res.json({ category, urgency });
  } catch (err) {
    res.status(503).json({ error: 'Classifier service unavailable', detail: String(err) });
  }
});

/**
 * Validates or invalidates the AI category for an email.
 * validated: true  = swipe right (confirmed correct)
 * validated: false = swipe left (marked wrong)
 * validated: null  = undo (reset to unreviewed)
 */
app.post('/api/emails/:id/validate', async (req, res) => {
  const { validated } = req.body as { validated?: boolean | null };

  if (validated !== null && typeof validated !== 'boolean') {
    res.status(400).json({ error: '"validated" must be a boolean or null' });
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
 * Reclassifies all emails that have no manual override.
 * Runs in the background — responds immediately with the count queued.
 */
app.post('/api/emails/reclassify', async (_req, res) => {
  const targets = db.data.emails.filter((e) => e.userOverrideCategory === null);

  for (const email of targets) {
    const { category } = await classifyEmail(email.subject, email.snippet, email.sender);
    email.aiCategory = category;
  }

  await db.write();
  console.log(`[Reclassify] Updated ${targets.length} email(s).`);
  res.json({ updated: targets.length });
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

startGmailSyncWorker();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
