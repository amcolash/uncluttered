import { twMerge } from 'tailwind-merge';

import { Button } from './ui/Button';

export function CategorySidebar({
  categories,
  onClick,
  active,
  enabled = true,
}: {
  categories: { key: string; label: string; description: string }[];
  onClick: (category: string) => void;
  active?: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex h-screen w-56 flex-col gap-3 overflow-y-auto border-r border-slate-700 bg-slate-900 p-4">
      <h2 className="mt-1.5 mb-3 ml-14 text-sm font-semibold tracking-wide text-slate-400">Categories</h2>
      {categories
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((c) => (
          <Button
            key={c.key}
            variant="secondary"
            size="sm"
            disabled={!enabled}
            onClick={() => enabled && onClick(c.key)}
            className={twMerge('w-full justify-start truncate text-left', active === c.key && 'brightness-75')}
            title={c.description}
          >
            {c.label}
          </Button>
        ))}
    </div>
  );
}
