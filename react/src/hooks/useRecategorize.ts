import { useEffect, useState } from 'react';
import { SIMILARITY_THRESHOLD, levenshteinSimilarity } from 'utilities/levenshtein';

import type { Category, Email } from 'hooks/useEmails';

const API = 'http://localhost:7001';

async function postCategorize(id: string, category: string | null, validated: boolean | null) {
  await fetch(`${API}/api/emails/${id}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, validated }),
  });
}

export function useRecategorize() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<Email[]>([]);

  useEffect(() => {
    fetch(`${API}/api/emails`)
      .then((r) => r.json())
      .then((all: Email[]) => setEmails(all.filter((e) => e.validated === false)));

    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function categorize(id: string, category: string) {
    const email = emails.find((e) => e.id === id);
    if (email) setHistory((prev) => [...prev, email]);

    const similar = emails.filter(
      (e) => e.id !== id && levenshteinSimilarity(email?.subject ?? '', e.subject) >= SIMILARITY_THRESHOLD
    );

    setEmails((prev) => prev.filter((e) => e.id !== id && !similar.some((s) => s.id === e.id)));

    await Promise.all([id, ...similar.map((e) => e.id)].map((eid) => postCategorize(eid, category, true)));
  }

  async function undo() {
    const email = history.at(-1);
    if (!email) return;
    setHistory((prev) => prev.slice(0, -1));
    setEmails((prev) => [email, ...prev]);
    await postCategorize(email.id, email.userOverrideCategory, false);
  }

  return { emails, categories, categorize, undo, canUndo: history.length > 0 };
}
