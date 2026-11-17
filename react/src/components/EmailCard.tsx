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
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <article
        aria-label={email.subject}
        className="flex h-full cursor-pointer flex-col overflow-hidden"
        onClick={() => setModalOpen(true)}
      >
        {/* Header Row: Sender & Date */}
        <header className="email-card-header">
          <span className="email-card-sender" title={email.sender}>
            {email.sender}
          </span>
          <time dateTime={email.date}>
            {new Date(email.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </header>

        {/* Subject */}
        <h2 className="mt-xs line-clamp-2" title={email.subject}>
          {email.subject}
        </h2>

        {/* Snippet preview */}
        {email.snippet && <p className="email-card-snippet line-clamp-4">{email.snippet}</p>}

        {/* Category Badge */}
        <footer className="mt-sm flex items-center justify-between">
          <Badge variant="primary">
            {formatCategory(email.userOverrideCategory ?? email.aiCategory)}
          </Badge>
        </footer>

        {/* AI Suggested Categories */}
        {suggestions && suggestions.length > 0 ? (
          <section
            aria-label="Suggested categories"
            className="mt-sm rounded-control border border-border-default bg-surface-subtle p-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Suggested categories</h3>
            <div role="group" aria-label="Suggestions" className="mt-xs flex flex-wrap gap-xs">
              {suggestions.map((suggestion) => (
                <Button
                  key={`${suggestion.source}-${suggestion.key}`}
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (categorize) categorize(email.id, suggestion.key);
                  }}
                >
                  {formatCategory(suggestion.key)}
                  {suggestion.confidence !== undefined ? ` · ${Math.round(suggestion.confidence * 100)}%` : ''}
                </Button>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      {modalOpen && <EmailModal email={email} onCategorize={categorize} onClose={() => setModalOpen(false)} />}
    </>
  );
}
