import { useEffect } from 'react';

import { CategorizeMenu } from 'components/CategorizeMenu';
import { EmailCard } from 'components/EmailCard';
import { Nav } from 'components/Nav';
import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Button } from 'components/ui/Button';
import { useEmails } from 'hooks/useEmails';
import { useSuggestions } from 'hooks/useSuggestions';

export function CategorizePage() {
  const { emails, categories, categoryCounts, canUndo, actions } = useEmails(true);
  const emailStack = emails.slice(0, 5);
  const current = emailStack[0];
  const suggestions = useSuggestions(current);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') actions.undo();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [actions, actions.undo]);

  return (
    <div className="flex justify-between p-2 sm:p-0">
      <Nav />

      <div className="flex flex-1 flex-col items-center gap-16 p-4 pt-6 sm:gap-20 sm:p-8">
        <div className="grid w-full max-w-4xl gap-4">
          <h1 className="text-2xl font-bold text-white">Review emails {emails.length > 0 && `(${emails.length})`}</h1>
          <p className="text-sm text-slate-400">
            Swipe right to confirm, swipe left to defer to the end of the pile. Use a category button to re-categorize.
          </p>

          <Button variant="secondary" size="sm" onClick={actions.undo} disabled={!canUndo}>
            Undo
          </Button>
        </div>

        {current ? (
          <CardStack>
            {emailStack.map((email, i) => (
              <SwipeCard
                key={email.id}
                onSwipe={(dir) => {
                  if (document.activeElement) (document.activeElement as HTMLElement).blur();

                  if (dir === 'right') {
                    actions.confirm(email.id);
                  } else {
                    actions.defer(email.id);
                  }
                }}
                index={i}
                className="border border-slate-900 bg-slate-700 p-4"
              >
                <EmailCard
                  email={email}
                  suggestions={email.id === current?.id ? suggestions : []}
                  categorize={actions.categorize}
                />
              </SwipeCard>
            ))}
          </CardStack>
        ) : (
          <p className="text-center text-lg text-white">
            <span>All done — no more emails to review.</span>
            <br />
            <br />
            <span className="text-4xl">🎉</span>
          </p>
        )}
      </div>

      <CategorizeMenu
        categories={categories}
        categoryCounts={categoryCounts}
        enabled={current !== undefined}
        onSelectCategory={(category) => current && actions.categorize(current.id, category)}
        activeCategory={current?.userOverrideCategory || current?.aiCategory}
        aiCategory={current?.aiCategory}
        userOverrideCategory={current?.userOverrideCategory}
      />
    </div>
  );
}
