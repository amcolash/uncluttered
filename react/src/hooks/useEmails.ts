import { useEffect, useState } from 'react';
import { SIMILARITY_THRESHOLD, levenshteinSimilarity } from 'utilities/levenshtein';
import { API, formatCategory } from 'utilities/util';

export interface Category {
  key: string;
  description: string;
  label: string;
  urgency: number;
}

export interface Email {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  snippet: string;
  aiCategory: string;
  userOverrideCategory: string | null;
  isArchived: boolean;
  processedAt: string;
  date: string;
  validated: boolean | null;
}

type HistoryEntry = {
  ids: string[];
  previous: Email[];
};

export type EmailActions = {
  confirm: (id: string) => Promise<void>;
  defer: (id: string) => Promise<void>;
  categorize: (id: string, category: string) => Promise<void>;
  undo: () => Promise<void>;
  archive: (id: string) => Promise<void>;
  trash: (id: string) => Promise<void>;
};

async function postCategorize(id: string, category: string | null, validated: boolean | null) {
  await fetch(`${API}/api/emails/${id}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, validated }),
  });
}

export function useEmails(filterValidated: boolean): {
  emails: Email[];
  categories: Category[];
  canUndo: boolean;
  actions: EmailActions;
} {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch(`${API}/api/emails`)
      .then((r) => r.json())
      .then((all: Email[]) =>
        setEmails(
          all.filter(
            (e) => !filterValidated || e.validated !== true || (e.userOverrideCategory || e.aiCategory) === 'UNKNOWN'
          )
        )
      );

    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((categories) =>
        setCategories(
          categories.map((c: { key: string; description: string }) => ({ ...c, label: formatCategory(c.key) }))
        )
      );
  }, [filterValidated]);

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

  async function archive(id: string) {
    await fetch(`${API}/api/emails/${id}/archive`, {
      method: 'POST',
    });

    setEmails((prev) => prev.filter((e) => e.id !== id));
  }

  async function trash(id: string) {
    await fetch(`${API}/api/emails/${id}`, {
      method: 'DELETE',
    });

    setEmails((prev) => prev.filter((e) => e.id !== id));
  }

  return {
    emails,
    categories,
    canUndo: history.length > 0,
    actions: {
      confirm,
      defer,
      categorize,
      undo,
      archive,
      trash,
    },
  };
}
