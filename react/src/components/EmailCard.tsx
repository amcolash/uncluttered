import { useState } from 'react';
import { formatCategory } from 'utilities/util';

import type { Email } from 'hooks/useEmails';
import type { Suggestion } from 'hooks/useSuggestions';

import { EmailModal } from './EmailModal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function EmailCard({
  email,
  suggestions,
  categorize,
}: {
  email: Email;
  suggestions?: Suggestion[];
  categorize?: (emailId: string, category: string) => void;
}) {
  const [modal, setModal] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg" onClick={() => setModal(true)}>
        <p className="truncate text-lg font-semibold text-slate-300">{email.sender}</p>
        <p className="-mt-2 mb-2 text-xs text-slate-400">{new Date(email.date).toLocaleString()}</p>
        <p className="text-md line-clamp-2 font-bold text-white">{email.subject}</p>
        <p className="line-clamp-4 text-slate-400">{email.snippet}</p>
        <Badge variant="outline" className="mt-2 w-fit p-2">
          {email.userOverrideCategory ?? email.aiCategory}
        </Badge>

        {suggestions && suggestions.length > 0 ? (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/30 p-3">
            <p className="text-xs tracking-[0.25em] text-slate-500 uppercase">Suggested categories</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={`${suggestion.source}-${suggestion.key}`}
                  variant="secondary"
                  className="p-2"
                  onClick={categorize ? () => categorize(email.id, suggestion.key) : undefined}
                >
                  {formatCategory(suggestion.key)}
                  {suggestion.confidence !== undefined ? ` · ${Math.round(suggestion.confidence * 100)}%` : ''}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {modal && <EmailModal email={email} onClose={() => setModal(false)} />}
    </>
  );
}
