import { useEffect, useState } from 'react';
import { SIMILARITY_THRESHOLD, levenshteinSimilarity } from 'utilities/levenshtein';

export interface Category {
  key: string;
  description: string;
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  aiCategory: string;
  userOverrideCategory: string | null;
  validated: boolean | null;
}

type HistoryEntry = {
  ids: string[];
  previous: Email[];
};

const API = 'http://localhost:7001';

async function postCategorize(id: string, category: string | null, validated: boolean | null) {
  await fetch(`${API}/api/emails/${id}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, validated }),
  });
}

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch(`${API}/api/emails`)
      .then((r) => r.json())
      .then((all: Email[]) => setEmails(all.filter((e) => e.validated !== true)));

    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function confirm(id: string) {
    const email = emails.find((e) => e.id === id);
    if (!email) return;

    const similar = emails.filter(
      (e) => e.id !== id && levenshteinSimilarity(email.subject, e.subject) >= SIMILARITY_THRESHOLD
    );
    const affected = [email, ...similar];

    setHistory((prev) => [...prev, { ids: affected.map((e) => e.id), previous: affected.map((e) => ({ ...e })) }]);
    setEmails((prev) => prev.filter((e) => !affected.some((a) => a.id === e.id)));

    await Promise.all(
      affected.map((item) =>
        fetch(`${API}/api/emails/${item.id}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validated: true }),
        })
      )
    );
  }

  async function defer(id: string) {
    const email = emails.find((e) => e.id === id);
    if (!email) return;

    setHistory((prev) => [...prev, { ids: [email.id], previous: [{ ...email }] }]);
    setEmails((prev) => [...prev.filter((e) => e.id !== id), email]);

    await fetch(`${API}/api/emails/${id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validated: false }),
    });
  }

  async function categorize(id: string, category: string) {
    const email = emails.find((e) => e.id === id);
    if (!email) return;

    const similar = emails.filter(
      (e) => e.id !== id && levenshteinSimilarity(email.subject, e.subject) >= SIMILARITY_THRESHOLD
    );
    const affected = [email, ...similar];

    setHistory((prev) => [...prev, { ids: affected.map((e) => e.id), previous: affected.map((e) => ({ ...e })) }]);
    setEmails((prev) => prev.filter((e) => !affected.some((a) => a.id === e.id)));

    await Promise.all(affected.map((item) => postCategorize(item.id, category, true)));
  }

  async function undo() {
    const entry = history.at(-1);
    if (!entry) return;

    setHistory((prev) => prev.slice(0, -1));
    setEmails((prev) => [...entry.previous, ...prev]);

    await Promise.all(
      entry.previous.map((email) => postCategorize(email.id, email.userOverrideCategory, email.validated))
    );
  }

  return {
    emails,
    categories,
    confirm,
    defer,
    categorize,
    undo,
    canUndo: history.length > 0,
  };
}
