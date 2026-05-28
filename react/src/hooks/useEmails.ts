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

const API = 'http://localhost:7001';

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<Email[]>([]);

  useEffect(() => {
    fetch(`${API}/api/emails`)
      .then((r) => r.json())
      .then((all: Email[]) => setEmails(all.filter((e) => e.validated == null)));

    fetch(`${API}/api/categories/active`)
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function validate(id: string, validated: boolean) {
    const email = emails.find((e) => e.id === id);
    if (email) setHistory((prev) => [...prev, email]);

    const similar = emails.filter(
      (e) => e.id !== id && levenshteinSimilarity(email?.subject ?? '', e.subject) >= SIMILARITY_THRESHOLD
    );

    setEmails((prev) => prev.filter((e) => e.id !== id && !similar.some((s) => s.id === e.id)));

    await Promise.all(
      [id, ...similar.map((e) => e.id)].map((eid) =>
        fetch(`${API}/api/emails/${eid}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validated }),
        })
      )
    );
  }

  async function undo() {
    const email = history.at(-1);
    if (!email) return;
    setHistory((prev) => prev.slice(0, -1));
    setEmails((prev) => [email, ...prev]);
    await fetch(`${API}/api/emails/${email.id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validated: null }),
    });
  }

  return { emails, categories, validate, undo, canUndo: history.length > 0 };
}
