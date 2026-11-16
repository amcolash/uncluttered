import { useEffect, useMemo, useState } from 'react';
import { FaMagic, FaSync, FaTags, FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API } from 'utilities/util';

import type { Category } from 'hooks/useEmails';
import type { Suggestion } from 'hooks/useSuggestions';

import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Fab } from './ui/Fab';

export interface CategorizeMenuProps {
  categories: Category[];
  categoryCounts?: Record<string, number>;
  onSelectCategory: (categoryKey: string) => void;
  activeCategory?: string | null;
  aiCategory?: string | null;
  userOverrideCategory?: string | null;
  enabled?: boolean;
  suggestions?: Suggestion[];
}

const LOCAL_STORAGE_KEY = 'uncluttered_recent_categories';

function getInitialRecent(categories: Category[], categoryCounts: Record<string, number>): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((key) => categories.some((c) => c.key === key));
        if (valid.length > 0) {
          const remaining = categories
            .filter((c) => c.key !== 'UNKNOWN' && !valid.includes(c.key))
            .sort((a, b) => (categoryCounts[b.key] || 0) - (categoryCounts[a.key] || 0))
            .map((c) => c.key);
          return [...valid, ...remaining].slice(0, 6);
        }
      }
    }
  } catch (err) {
    console.error('Error loading recent categories from localStorage:', err);
  }

  return categories
    .filter((c) => c.key !== 'UNKNOWN')
    .sort((a, b) => (categoryCounts[b.key] || 0) - (categoryCounts[a.key] || 0))
    .slice(0, 6)
    .map((c) => c.key);
}

export function CategorizeMenu({
  categories,
  categoryCounts = {},
  onSelectCategory,
  activeCategory,
  aiCategory,
  userOverrideCategory,
  enabled = true,
  suggestions = [],
}: CategorizeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [recentKeys, setRecentKeys] = useState<string[]>([]);

  // Derive suggested categories
  const suggestedCategories = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const list: (Category & { confidence?: number })[] = [];
    for (const s of suggestions) {
      const found = categories.find((c) => c.key === s.key);
      if (found) {
        list.push({ ...found, confidence: s.confidence });
      }
    }
    return list;
  }, [categories, suggestions]);

  // Initialize 6 recent categories
  useEffect(() => {
    if (categories.length === 0) return;
    setRecentKeys((prev) => {
      if (prev.length >= 6) return prev;
      return getInitialRecent(categories, categoryCounts);
    });
  }, [categories, categoryCounts]);

  // Derive 6 recent categories
  const recentCategories = useMemo(() => {
    const list: Category[] = [];
    for (const key of recentKeys) {
      const found = categories.find((c) => c.key === key);
      if (found) list.push(found);
    }

    if (list.length < 6 && categories.length > 0) {
      const usedKeys = new Set(list.map((c) => c.key));
      const filler = [...categories]
        .filter((c) => c.key !== 'UNKNOWN' && !usedKeys.has(c.key))
        .sort((a, b) => (categoryCounts[b.key] || 0) - (categoryCounts[a.key] || 0));

      for (const cat of filler) {
        list.push(cat);
        if (list.length === 6) break;
      }
    }

    return list.slice(0, 6);
  }, [categories, recentKeys, categoryCounts]);

  // Entire list sorted alphabetically
  const alphabeticalCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

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

  const handleReclassify = async () => {
    setReclassifying(true);
    try {
      await fetch(`${API}/api/emails/reclassify`, { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setReclassifying(false);
    }
  };

  const handleSelect = (categoryKey: string) => {
    if (!enabled) return;

    setRecentKeys((prev) => {
      const updated = [categoryKey, ...prev.filter((k) => k !== categoryKey)].slice(0, 6);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    onSelectCategory(categoryKey);
    setIsOpen(false);
  };

  const renderCategoryButton = (c: Category, confidence?: number) => {
    const isOverride = userOverrideCategory === c.key;
    const isAi = aiCategory === c.key;
    const isSuggested = confidence !== undefined;
    const isActive = isOverride || (!userOverrideCategory && isAi) || activeCategory === c.key;

    let borderStyles =
      'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white active:bg-slate-950';

    if (isOverride) {
      // User override: cyan border (no double rings)
      borderStyles = 'border-2 border-cyan-400 bg-cyan-950/40 font-semibold text-cyan-100';
    } else if (isAi) {
      // AI prediction: indigo border (no double rings)
      borderStyles = 'border-2 border-indigo-400 bg-indigo-950/40 font-semibold text-indigo-100';
    } else if (isSuggested) {
      // Suggested category: amber border
      borderStyles = 'border-2 border-amber-400/80 bg-amber-950/30 font-semibold text-amber-100 hover:bg-amber-900/40';
    } else if (isActive) {
      borderStyles = 'border-2 border-cyan-400 bg-cyan-950/40 font-semibold text-cyan-100';
    }

    const badgeHint = isOverride
      ? ' (User Override)'
      : isAi
        ? ' (AI Prediction)'
        : isSuggested
          ? ` (Suggested · ${Math.round(confidence * 100)}%)`
          : '';

    return (
      <button
        key={isSuggested ? `${c.key}-suggested` : c.key}
        type="button"
        disabled={!enabled}
        onClick={() => handleSelect(c.key)}
        title={c.description + badgeHint}
        className={twMerge(
          'group flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-center text-sm leading-snug font-medium transition-colors',
          'focus-visible:border-white focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          borderStyles
        )}
      >
        <span className="line-clamp-2 break-words">
          {c.label}
          {confidence !== undefined ? ` · ${Math.round(confidence * 100)}%` : ''}
        </span>
      </button>
    );
  };

  const renderCategorySections = () => (
    <>
      {/* Suggested Section */}
      {suggestedCategories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-amber-400 uppercase">Suggested</h3>
          <div className="grid grid-cols-2 gap-2">
            {suggestedCategories.map((c) => renderCategoryButton(c, c.confidence))}
          </div>
        </div>
      )}

      {/* 6 Recent Section */}
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">Recent</h3>
        <div className="grid grid-cols-2 gap-2">{recentCategories.map((c) => renderCategoryButton(c))}</div>
      </div>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs tracking-wider uppercase">
          <span className="bg-slate-900 px-3 font-semibold text-slate-400">All Categories</span>
        </div>
      </div>

      {/* Entire alphabetical list */}
      <div>
        <div className="grid grid-cols-2 gap-2">{alphabeticalCategories.map((c) => renderCategoryButton(c))}</div>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR: visible on lg and above, placed on the right */}
      <aside className="sticky top-0 right-0 z-10 hidden h-screen w-80 shrink-0 flex-col border-l border-slate-700 bg-slate-900 p-4 lg:flex lg:w-96">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Categories</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={syncing || reclassifying}
              title="Sync emails from Gmail"
              className="h-7 px-2.5 text-xs"
            >
              <FaSync className={twMerge('text-xs', syncing && 'animate-spin')} />
              <span className="text-xs">Sync</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReclassify}
              disabled={syncing || reclassifying}
              title="Reclassify unvalidated emails with latest rules and model"
              className="h-7 px-2.5 text-xs"
            >
              <FaMagic className={twMerge('text-xs', reclassifying && 'animate-spin')} />
              <span className="text-xs">{reclassifying ? 'Reclassifying...' : 'Reclassify'}</span>
            </Button>
          </div>
        </div>

        {/* Scrollable category list */}
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">{renderCategorySections()}</div>
      </aside>

      {/* MOBILE: FAB + Bottom Sheet (hidden on lg and above) */}
      <div className="lg:hidden">
        <Fab
          icon={<FaTags className="text-xl" />}
          openIcon={<FaTimes className="text-xl" />}
          isOpen={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          disabled={!enabled}
          aria-label={isOpen ? 'Close categorize menu' : 'Open categorize menu'}
          title={isOpen ? 'Close menu' : 'Categorize email'}
        />

        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Categorize"
          headerActions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSync}
                disabled={syncing || reclassifying}
                title="Sync emails from Gmail"
                className="h-7 px-2.5 text-xs"
              >
                <FaSync className={twMerge('text-xs', syncing && 'animate-spin')} />
                <span className="text-xs">Sync</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReclassify}
                disabled={syncing || reclassifying}
                title="Reclassify unvalidated emails with latest rules and model"
                className="h-7 px-2.5 text-xs"
              >
                <FaMagic className={twMerge('text-xs', reclassifying && 'animate-spin')} />
                <span className="text-xs">{reclassifying ? 'Reclassifying...' : 'Reclassify'}</span>
              </Button>
            </div>
          }
        >
          {renderCategorySections()}
        </BottomSheet>
      </div>
    </>
  );
}
