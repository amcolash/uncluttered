import { type ReactNode, useEffect, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { type Email, useEmails } from 'hooks/useEmails';

function EmailCard({ email }: { email: Email }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg">
      <p className="truncate text-lg font-semibold text-slate-300">{email.sender}</p>
      <p className="text-md line-clamp-2 font-bold text-white">{email.subject}</p>
      <p className="line-clamp-4 text-slate-400">{email.snippet}</p>
      <Badge variant="outline" className="mt-2 w-fit p-2">
        {email.userOverrideCategory ?? email.aiCategory}
      </Badge>
    </div>
  );
}

function Menu({ children }: { children: ReactNode }) {
  const breakpoint = useBreakpoint();
  const [visible, setVisible] = useState(breakpoint !== 'sm' && breakpoint !== 'md');

  useEffect(() => {
    if (breakpoint === 'sm' || breakpoint === 'md') setVisible(false);
    else setVisible(true);
  }, [breakpoint]);

  return (
    <div className="relative inset-0 z-10 max-md:absolute">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-4 left-4 z-10"
      >
        {visible ? <FaTimes /> : <FaBars />}
      </Button>
      {visible && children}
    </div>
  );
}

function CategorySidebar({
  categories,
  current,
  categorize,
}: {
  categories: { key: string; description: string }[];
  current?: Email;
  categorize: (id: string, category: string) => void;
}) {
  return (
    <div className="flex h-screen w-80 flex-col gap-3 overflow-y-auto border-r border-slate-700 bg-slate-900 p-4">
      <h2 className="mb-3 ml-14 text-sm font-semibold tracking-wide text-slate-400 uppercase">Categories</h2>
      {categories
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((c) => (
          <Button
            key={c.key}
            variant="secondary"
            size="sm"
            disabled={!current}
            onClick={() => current && categorize(current.id, c.key)}
            className="w-full justify-start truncate text-left"
            title={c.description}
          >
            {c.key}
          </Button>
        ))}
    </div>
  );
}

export function AppPage() {
  const { emails, categories, confirm, defer, categorize, undo, canUndo } = useEmails();
  const current = emails[0];

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
                <EmailCard email={email} />
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
