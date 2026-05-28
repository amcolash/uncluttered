import type { Email } from 'hooks/useEmails';

import { Button } from './ui/Button';

export function CategorySidebar({
  categories,
  current,
  categorize,
}: {
  categories: { key: string; description: string }[];
  current?: Email;
  categorize: (id: string, category: string) => void;
}) {
  return (
    <div className="flex h-screen w-56 flex-col gap-3 overflow-y-auto border-r border-slate-700 bg-slate-900 p-4">
      <h2 className="mt-1.5 mb-3 ml-14 text-sm font-semibold tracking-wide text-slate-400 uppercase">Categories</h2>
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
