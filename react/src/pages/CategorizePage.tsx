import { useEffect } from 'react';

import { CategorySidebar } from 'components/CategorySidebar';
import { Menu } from 'components/Menu';
import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import { type Email, useEmails } from 'hooks/useEmails';
import { type Suggestion, useSuggestions } from 'hooks/useSuggestions';

function EmailCard({
  email,
  suggestions,
  categorize,
}: {
  email: Email;
  suggestions: Suggestion[];
  categorize: (emailId: string, category: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg">
      <p className="truncate text-lg font-semibold text-slate-300">{email.sender}</p>
      <p className="text-md line-clamp-2 font-bold text-white">{email.subject}</p>
      <p className="line-clamp-4 text-slate-400">{email.snippet}</p>
      <Badge variant="outline" className="mt-2 w-fit p-2">
        {email.userOverrideCategory ?? email.aiCategory}
      </Badge>

      {suggestions.length > 0 ? (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/30 p-3">
          <p className="text-xs tracking-[0.25em] text-slate-500 uppercase">Suggested categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={`${suggestion.source}-${suggestion.key}`}
                variant="secondary"
                className="p-2"
                onClick={() => categorize(email.id, suggestion.key)}
              >
                {suggestion.key}
                {suggestion.confidence !== undefined ? ` · ${Math.round(suggestion.confidence * 100)}%` : ''}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CategorizePage() {
  const { emails, categories, confirm, defer, categorize, undo, canUndo } = useEmails();
  const current = emails[0];
  const suggestions = useSuggestions(current);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') undo();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [undo]);

  return (
    <div className="flex justify-center gap-8">
      <Menu>
        <CategorySidebar categories={categories} current={current} categorize={categorize} />
      </Menu>

      <div className="flex flex-1 flex-col items-center gap-20 p-8">
        <div className="grid w-full max-w-4xl gap-4">
          <h1 className="mt-8 text-2xl font-bold text-white">Review emails</h1>
          <p className="text-sm text-slate-400">
            Swipe right to confirm, swipe left to defer to the end of the pile. Use a category button to re-categorize.
          </p>

          <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo}>
            Undo
          </Button>
        </div>

        {current ? (
          <CardStack>
            {emails.slice(0, 5).map((email, i) => (
              <SwipeCard
                key={email.id + Math.random()}
                onSwipe={(dir) => (dir === 'right' ? confirm(email.id) : defer(email.id))}
                index={i}
                className="border border-slate-900 bg-slate-700 p-4"
              >
                <EmailCard
                  email={email}
                  suggestions={email.id === current?.id ? suggestions : []}
                  categorize={categorize}
                />
              </SwipeCard>
            ))}
          </CardStack>
        ) : (
          <p className="text-lg text-white">All done — no more emails to review.</p>
        )}
      </div>
    </div>
  );
}
