import cors from 'cors';
import express from 'express';

import { db } from './db.ts';
import { DEFAULT_URGENCY, classifyEmail } from './emailClassifier.ts';
import { startGmailSyncWorker } from './gmailSyncWorker.ts';

const app = express();
const port = 7001;

app.use(cors());
app.use(express.json());

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
 * Manually overrides the AI-assigned category and/or urgency for an email.
 * Validates category against the stored category keys; urgency must be 1-5.
 */
app.post('/api/emails/:id/override', async (req, res) => {
  const { category, urgency } = req.body as { category?: string; urgency?: number };

  if (category === undefined && urgency === undefined) {
    res.status(400).json({ error: 'At least one of "category" or "urgency" is required' });
    return;
  }

  if (category !== undefined) {
    const validKeys = db.data.categories.map((c) => c.key);
    if (!validKeys.includes(category)) {
      res.status(400).json({ error: 'Invalid category', validCategories: validKeys });
      return;
    }
  }

  if (urgency !== undefined && (!Number.isInteger(urgency) || urgency < 1 || urgency > 5)) {
    res.status(400).json({ error: '"urgency" must be an integer between 1 and 5' });
    return;
  }

  const email = db.data.emails.find((e) => e.id === req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  if (category !== undefined) email.userOverrideCategory = category;
  if (urgency !== undefined) email.userOverrideUrgency = urgency;
  await db.write();
  res.json({ success: true });
});

// ── Reclassify endpoints ─────────────────────────────────────────────────────

/**
 * Dry-run reclassification — runs the classifier on every non-overridden email
 * and returns a diff of current vs proposed results. Nothing is written to db.
 */
app.get('/api/emails/reclassify/preview', async (_req, res) => {
  const targets = db.data.emails.filter((e) => e.userOverrideCategory === null);

  const results = await Promise.all(
    targets.map(async (email) => {
      const { category, urgency, confidence } = await classifyEmail(email.subject, email.snippet, email.sender);
      return {
        id: email.id,
        sender: email.sender,
        subject: email.subject,
        snippet: email.snippet,
        current: { category: email.aiCategory, urgency: email.aiUrgency },
        proposed: { category, urgency, confidence },
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

/** Reclassifies a single email and returns the updated object. */
app.post('/api/emails/:id/reclassify', async (req, res) => {
  const email = db.data.emails.find((e) => e.id === req.params.id);

  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }

  const { category, urgency } = await classifyEmail(email.subject, email.snippet, email.sender);
  email.aiCategory = category;
  email.aiUrgency = urgency;
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
    const { category, urgency } = await classifyEmail(email.subject, email.snippet, email.sender);
    email.aiCategory = category;
    email.aiUrgency = urgency;
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
  const examples = db.data.emails
    .filter((e) => e.userOverrideCategory ?? e.aiCategory)
    .map((e) => ({
      subject: e.subject,
      snippet: e.snippet,
      sender: e.sender,
      category: (e.userOverrideCategory ?? e.aiCategory) as string,
      urgency:
        e.userOverrideUrgency ?? e.aiUrgency ?? DEFAULT_URGENCY[e.userOverrideCategory ?? e.aiCategory ?? ''] ?? 3,
    }));

  try {
    const response = await fetch('http://localhost:7002/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examples }),
      signal: AbortSignal.timeout(30_000),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'Classifier service unavailable', detail: String(err) });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

startGmailSyncWorker();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
