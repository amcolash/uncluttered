import cors from 'cors';
import express from 'express';

import { db } from './db.ts';
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
  res.json({ success: true });
});

// ── Start ────────────────────────────────────────────────────────────────────

startGmailSyncWorker();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
