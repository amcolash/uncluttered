import { useEffect, useState } from 'react';

import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import { useEmails } from 'hooks/useEmails';

export function AppPage() {
  const { emails, validate, undo, canUndo } = useEmails();

  const [categories, setCategories] = useState<{ key: string; description: string }[]>([]);
  useEffect(() => {
    fetch('http://localhost:7001/api/categories/active')
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 bg-slate-800 p-6">
      <h1 className="text-center text-2xl font-bold text-white">Verify Categorization</h1>

      {/* <Button onClick={() => {}}>Retrain model</Button>
      <Button onClick={() => {}}>Reclassify Preview</Button> */}

      <div className="absolute inset-4 right-auto rounded-lg bg-slate-700 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-white">Active Categories</h2>
        <div className="flex flex-col gap-2">
          {categories
            .sort((a, b) => a.key.localeCompare(b.key))
            .map((c) => (
              <Badge key={c.key} variant="outline" className="w-fit p-2">
                {c.key}
              </Badge>
            ))}
        </div>
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
              <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg">
                <p className="truncate text-lg font-semibold text-slate-300">{email.sender}</p>
                <p className="text-md line-clamp-2 font-bold text-white">{email.subject}</p>
                <p className="line-clamp-4 text-slate-400">{email.snippet}</p>
                <Badge variant="outline" className="mt-2 w-fit p-2">
                  {email.userOverrideCategory ?? email.aiCategory}
                </Badge>
              </div>
            </SwipeCard>
          ))}
        </CardStack>
      ) : (
        <p className="text-lg text-white">No more emails to verify!</p>
      )}
    </div>
  );
}
