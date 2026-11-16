import { useEffect, useState } from 'react';
import { SIMILARITY_THRESHOLD, levenshteinSimilarity } from 'utilities/levenshtein';
import { API, formatCategory } from 'utilities/util';

import { useServerStatus } from 'contexts/ServerStatusContext';

const DRY_RUN = false;

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
  validated: boolean;
  important: boolean;
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
  markImportant: (id: string, important: boolean) => Promise<void>;
  batchArchive: (ids: string[]) => Promise<void>;
  batchTrash: (ids: string[]) => Promise<void>;
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
  categoryCounts: Record<string, number>;
  canUndo: boolean;
  actions: EmailActions;
} {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { setServerReachable } = useServerStatus();

  async function fetchEmails() {
    try {
      const res = await fetch(`${API}/api/emails`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all: Email[] = await res.json();
      setServerReachable(true);

      const counts: Record<string, number> = {};
      for (const email of all) {
        const cat = email.userOverrideCategory || email.aiCategory;
        if (cat) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
      setCategoryCounts(counts);

      const filtered = all
        .filter(
          (e) => !filterValidated || e.validated !== true || (e.userOverrideCategory || e.aiCategory) === 'UNKNOWN'
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEmails(filtered);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setServerReachable(false);
    }
  }

  async function fetchCategories() {
    try {
      const r = await fetch(`${API}/api/categories`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const cats = await r.json();
      setCategories(cats.map((c: { key: string; description: string }) => ({ ...c, label: formatCategory(c.key) })));
      setServerReachable(true);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setServerReachable(false);
    }
  }

  useEffect(() => {
    fetchEmails();
    fetchCategories();
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

  async function archive(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id));

    try {
      if (!DRY_RUN) {
        const res = await fetch(`${API}/api/emails/${id}/archive`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Archive failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('Archive failed:', err);
      fetchEmails();
    }
  }

  async function trash(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id));

    try {
      if (!DRY_RUN) {
        const res = await fetch(`${API}/api/emails/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Trash failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('Trash failed:', err);
      fetchEmails();
    }
  }

  async function markImportant(id: string, important: boolean) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, important } : e)));

    try {
      const res = await fetch(`${API}/api/emails/${id}/important`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ important }),
      });
      if (!res.ok) throw new Error(`Mark important failed with status ${res.status}`);
    } catch (err) {
      console.error('Mark important failed:', err);
      fetchEmails();
    }
  }

  async function batchArchive(ids: string[]) {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));

    try {
      if (!DRY_RUN) {
        const res = await fetch(`${API}/api/emails/batch/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error(`Batch archive failed with status ${res.status}`);
      }
    } catch (error) {
      // If the request fails, refetch emails to ensure UI consistency
      console.error('Batch archive failed:', error);
      fetchEmails();
    }
  }

  async function batchTrash(ids: string[]) {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));

    try {
      if (!DRY_RUN) {
        const res = await fetch(`${API}/api/emails/batch/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error(`Batch trash failed with status ${res.status}`);
      }
    } catch (error) {
      // If the request fails, refetch emails to ensure UI consistency
      console.error('Batch trash failed:', error);
      fetchEmails();
    }
  }

  return {
    emails,
    categories,
    categoryCounts,
    canUndo: history.length > 0,
    actions: {
      confirm,
      defer,
      categorize,
      undo,
      archive,
      trash,
      markImportant,
      batchArchive,
      batchTrash,
    },
  };
}
