import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import { type Email, useEmails } from 'hooks/useEmails';

function Email({ email }: { email: Email }) {
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

export function AppPage() {
  const { emails, validate, undo, canUndo } = useEmails();

  const [categories, setCategories] = useState<{ key: string; description: string }[]>([]);
  useEffect(() => {
    fetch('http://localhost:7001/api/categories/active')
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') undo();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [undo]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 bg-slate-800 p-6">
      <h1 className="text-center text-2xl font-bold text-white">Verify Categorization ({emails.length})</h1>

      {/* <Button onClick={() => {}}>Retrain model</Button>
      <Button onClick={() => {}}>Reclassify Preview</Button> */}

      <div className="absolute inset-0 right-auto flex w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-slate-700 p-4">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-400 uppercase">Categories</h2>
        {categories
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((c) => (
            <Button
              key={c.key}
              variant="secondary"
              size="sm"
              disabled
              className="w-full cursor-auto justify-start text-left"
              title={c.description}
            >
              {c.key}
            </Button>
          ))}
      </div>

      <Button onClick={undo} disabled={!canUndo}>
        Undo
      </Button>

      {emails.length > 0 ? (
        <CardStack>
          {emails.map((email, i) => (
            <SwipeCard
              key={email.id}
              onSwipe={(dir) => validate(email.id, dir === 'right')}
              index={i}
              className="border border-slate-900 bg-slate-700 p-4"
            >
              <Email email={email} />
            </SwipeCard>
          ))}
        </CardStack>
      ) : (
        <p className="text-lg text-white">
          No more emails to verify!{' '}
          <Link to="/categorize" className="text-indigo-400 underline hover:text-indigo-300">
            Re-categorize →
          </Link>
        </p>
      )}
    </div>
  );
}
