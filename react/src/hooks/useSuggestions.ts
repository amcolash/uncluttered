import { useEffect, useState } from 'react';
import { API } from 'utilities/util';

import type { Email } from './useEmails';

export type Suggestion = {
  key: string;
  source: 'ml' | 'rule';
  confidence?: number;
};

export function useSuggestions(email: Email | null) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (!email) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const payload = {
      subject: email.subject,
      snippet: email.snippet,
      sender: email.sender,
    };

    fetch(`${API}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        return res.json();
      })
      .then((data) => {
        const ml = Array.isArray(data.mlSuggestions)
          ? data.mlSuggestions.map((item: { category: string; confidence: number }) => ({
              key: item.category,
              source: 'ml' as const,
              confidence: item.confidence,
            }))
          : [];

        const rule = Array.isArray(data.ruleSuggestions)
          ? data.ruleSuggestions.map((key: string) => ({ key, source: 'rule' as const }))
          : [];

        setSuggestions([...ml, ...rule]);
      })
      .catch(() => {
        setSuggestions([]);
      });

    return () => {
      controller.abort();
    };
  }, [email]);

  return suggestions;
}
