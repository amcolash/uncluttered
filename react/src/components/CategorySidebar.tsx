import { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API } from 'utilities/util';

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
  const [syncing, setSyncing] = useState(false);

  return (
    <div className="flex h-screen w-56 flex-col gap-3 overflow-y-auto border-r border-slate-700 bg-slate-900 p-4">
      <div className="flex gap-6">
        <h2 className="mt-1.5 mb-3 ml-14 text-sm font-semibold tracking-wide text-slate-400">Categories</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            setSyncing(true);
            try {
              await fetch(`${API}/api/emails/sync`, { method: 'POST' });
              window.location.reload();
            } catch (err) {
              console.error(err);
            } finally {
              setSyncing(false);
            }
          }}
          disabled={syncing}
        >
          <FaSync className={syncing ? 'animate-spin' : ''} />
        </Button>
      </div>
      {categories.map((c) => (
        <Button
          key={c.key}
          variant="secondary"
          size="sm"
          disabled={!enabled}
          onClick={() => enabled && onClick(c.key)}
          className={twMerge(
            'w-full justify-start truncate text-left',
            active === c.key && 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-800'
          )}
          title={c.description}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );
}
