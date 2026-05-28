import { useEffect } from 'react';

import { CategorySidebar } from 'components/CategorySidebar';
import { EmailCard } from 'components/EmailCard';
import { Menu } from 'components/Menu';
import { Nav } from 'components/Nav';
import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Button } from 'components/ui/Button';
import { useEmails } from 'hooks/useEmails';
import { useSuggestions } from 'hooks/useSuggestions';

export function CategorizePage() {
  const { emails, categories, confirm, defer, categorize, undo, canUndo } = useEmails(true);
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
        <CategorySidebar
          categories={categories}
          enabled={current !== undefined}
          onClick={(category) => current && categorize(current.id, category)}
        />
      </Menu>

      <Nav />

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
          <p className="text-center text-lg text-white">
            <span>All done — no more emails to review.</span>
            <br />
            <br />
            <span className="text-4xl">🎉</span>
          </p>
        )}
      </div>
    </div>
  );
}
