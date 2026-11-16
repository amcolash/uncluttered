import { useState } from 'react';
import { FaStar, FaSync, FaTags, FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API } from 'utilities/util';

import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Fab } from './ui/Fab';

export interface CategorySidebarProps {
  categories: { key: string; label: string; description: string }[];
  onClick: (category: string) => void;
  active?: string;
  enabled?: boolean;
  importantCount?: number;
}

export function CategorySidebar({ categories, onClick, active, enabled = true, importantCount }: CategorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API}/api/emails/sync`, { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelect = (categoryKey: string) => {
    if (!enabled) return;
    onClick(categoryKey);
    setIsOpen(false);
  };

  const renderCategoryButton = (c: { key: string; label: string; description: string }) => {
    const isActive = active === c.key;

    return (
      <button
        key={c.key}
        type="button"
        disabled={!enabled}
        onClick={() => handleSelect(c.key)}
        title={c.description}
        className={twMerge(
          'group flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-center text-sm leading-snug font-medium transition-colors',
          'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white active:bg-slate-950',
          'focus-visible:border-white focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isActive && 'border-2 border-cyan-400 bg-cyan-950/40 font-semibold text-cyan-100'
        )}
      >
        <span className="line-clamp-2 break-words">{c.label}</span>
      </button>
    );
  };

  const renderContent = () => (
    <>
      {/* Important emails button (full width across 2 columns) */}
      {importantCount !== undefined && importantCount > 0 && (
        <button
          type="button"
          disabled={!enabled}
          onClick={() => handleSelect('IMPORTANT')}
          title="Important emails"
          className={twMerge(
            'group flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm leading-snug font-medium transition-colors',
            'border border-yellow-500/40 bg-slate-800 text-yellow-300 hover:bg-slate-700 hover:text-yellow-200 active:bg-slate-950',
            'focus-visible:border-white focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            active === 'IMPORTANT' && 'border-2 border-yellow-400 bg-yellow-950/40 font-semibold text-yellow-200'
          )}
        >
          <FaStar className="shrink-0 text-yellow-400" />
          <span>({importantCount}) Important</span>
        </button>
      )}

      {/* 2-Column Categories Grid */}
      <div className="grid grid-cols-2 gap-2">{categories.map((c) => renderCategoryButton(c))}</div>
    </>
  );

  const syncButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      title="Sync emails from Gmail"
      className="h-7 px-2.5 text-xs"
    >
      <FaSync className={twMerge('text-xs', syncing && 'animate-spin')} />
      <span className="text-xs">Sync</span>
    </Button>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR: visible on lg and above */}
      <aside className="sticky top-0 left-0 z-10 hidden h-screen w-80 shrink-0 flex-col border-r border-slate-700 bg-slate-900 p-4 lg:flex lg:w-96">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">Categories</h2>
            {syncButton}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">{renderContent()}</div>
      </aside>

      {/* MOBILE: FAB + Bottom Sheet (hidden on lg and above) */}
      <div className="lg:hidden">
        <Fab
          icon={<FaTags className="text-xl" />}
          openIcon={<FaTimes className="text-xl" />}
          isOpen={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          disabled={!enabled}
          aria-label={isOpen ? 'Close categories' : 'Open categories'}
          title={isOpen ? 'Close categories' : 'Open categories'}
        />

        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Categories" headerActions={syncButton}>
          {renderContent()}
        </BottomSheet>
      </div>
    </>
  );
}
