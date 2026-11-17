import { useEffect, useMemo, useState } from 'react';
import { FaLayerGroup, FaMagic, FaMailBulk, FaRedo, FaStar, FaSync, FaTags, FaTimes } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { API, clearPwaCacheAndReload } from 'utilities/util';

import type { Category } from 'hooks/useEmails';
import type { Suggestion } from 'hooks/useSuggestions';

import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Fab } from './ui/Fab';

export interface AppSidebarProps {
  categories: Category[];
  categoryCounts?: Record<string, number>;
  activeCategory?: string | null;
  onSelectCategory: (category: string) => void;
  enabled?: boolean;
  importantCount?: number;
  suggestions?: Suggestion[];
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
  showReclassify?: boolean;
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
    console.error('Error loading recent categories:', err);
  }

  return categories
    .filter((c) => c.key !== 'UNKNOWN')
    .sort((a, b) => (categoryCounts[b.key] || 0) - (categoryCounts[a.key] || 0))
    .slice(0, 6)
    .map((c) => c.key);
}

export function AppSidebar({
  categories,
  categoryCounts = {},
  activeCategory,
  onSelectCategory,
  enabled = true,
  importantCount,
  suggestions = [],
  isBatchMode = false,
  onToggleBatchMode,
  showReclassify = false,
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [recentKeys, setRecentKeys] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const isCategorizeView =
    location.pathname === '/' || location.pathname === '/batch' || location.pathname.startsWith('/categorize');
  const isInboxView = location.pathname.startsWith('/inbox');

  // Track recent categories
  useEffect(() => {
    if (categories.length === 0) return;
    setRecentKeys((prev) => {
      if (prev.length >= 6) return prev;
      return getInitialRecent(categories, categoryCounts);
    });
  }, [categories, categoryCounts]);

  const updateRecent = (categoryKey: string) => {
    if (categoryKey === 'UNKNOWN' || categoryKey === 'IMPORTANT') return;
    setRecentKeys((prev) => {
      const filtered = prev.filter((k) => k !== categoryKey);
      const next = [categoryKey, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleSelect = (key: string) => {
    if (!enabled) return;
    updateRecent(key);
    onSelectCategory(key);
    setIsOpen(false);
  };

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearPwaCacheAndReload();
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

  // Derived suggestions & categories
  const suggestedCategories = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const list: (Category & { confidence?: number })[] = [];
    for (const s of suggestions) {
      const found = categories.find((c) => c.key === s.key);
      if (found) list.push({ ...found, confidence: s.confidence });
    }
    return list;
  }, [categories, suggestions]);

  const recentCategories = useMemo(() => {
    if (recentKeys.length === 0) return [];
    const list: Category[] = [];
    for (const key of recentKeys) {
      const found = categories.find((c) => c.key === key);
      if (found) list.push(found);
    }
    return list;
  }, [categories, recentKeys]);

  const alphabeticalCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const renderCategoryButton = (
    c: { key: string; label: string; description?: string },
    highlightType?: 'active' | 'suggested'
  ) => {
    const isActive = activeCategory === c.key;
    const isSuggested = highlightType === 'suggested';
    const count = categoryCounts[c.key];

    return (
      <button
        key={c.key}
        type="button"
        disabled={!enabled}
        onClick={() => handleSelect(c.key)}
        title={c.description || c.label}
        aria-pressed={isActive}
        className={twMerge('category-btn', isSuggested && 'is-suggested', isActive && 'is-active')}
      >
        <span className="line-clamp-2 leading-tight break-words">{c.label}</span>
        {count !== undefined && count > 0 && <span className="count-pill">{count}</span>}
      </button>
    );
  };

  const renderContent = () => (
    <div className="gap-md flex flex-col">
      {/* Important Shortcut Button */}
      {importantCount !== undefined && importantCount > 0 && (
        <button
          type="button"
          disabled={!enabled}
          onClick={() => handleSelect('IMPORTANT')}
          title="Important & Starred emails"
          aria-pressed={activeCategory === 'IMPORTANT'}
          className={twMerge(
            'category-btn border-status-warning/40 text-status-warning hover:bg-status-warning-subtle',
            activeCategory === 'IMPORTANT' && 'border-status-warning bg-status-warning-subtle border-2 shadow-sm'
          )}
        >
          <div className="gap-xs flex items-center">
            <FaStar className="text-status-warning" />
            <span>Important Emails</span>
          </div>
          <span className="bg-status-warning-subtle px-xs py-2xs text-status-warning rounded-full text-[10px] font-bold">
            {importantCount}
          </span>
        </button>
      )}

      {/* Suggested Categories */}
      {suggestedCategories.length > 0 && (
        <section aria-labelledby="suggested-heading" className="gap-xs flex flex-col">
          <h3 id="suggested-heading">Suggested</h3>
          <div className="gap-xs grid grid-cols-2">
            {suggestedCategories.map((c) => renderCategoryButton(c, 'suggested'))}
          </div>
        </section>
      )}

      {/* Recent Categories */}
      {recentCategories.length > 0 && (
        <section aria-labelledby="recent-heading" className="gap-xs flex flex-col">
          <h3 id="recent-heading">Recent</h3>
          <div className="gap-xs grid grid-cols-2">{recentCategories.map((c) => renderCategoryButton(c))}</div>
        </section>
      )}

      {/* Categories Grid */}
      <section aria-labelledby="all-categories-heading" className="gap-xs flex flex-col">
        <h3 id="all-categories-heading">Categories ({categories.length})</h3>
        <div className="gap-xs grid grid-cols-2">{alphabeticalCategories.map((c) => renderCategoryButton(c))}</div>
      </section>
    </div>
  );

  const toolbarButtons = (
    <div role="toolbar" aria-label="Category Tools" className="gap-xs flex flex-wrap items-center">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSync}
        disabled={syncing || reclassifying}
        title="Sync emails from Gmail"
        className="px-xs h-7 text-xs"
      >
        <FaSync className={twMerge('text-xs', syncing && 'animate-spin')} />
        <span>Sync</span>
      </Button>

      {showReclassify && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReclassify}
          disabled={syncing || reclassifying}
          title="Reclassify unvalidated emails"
          className="px-xs h-7 text-xs"
        >
          <FaMagic className={twMerge('text-xs', reclassifying && 'animate-spin')} />
          <span>{reclassifying ? '...' : 'Reclassify'}</span>
        </Button>
      )}

      {onToggleBatchMode && (
        <Button
          variant={isBatchMode ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleBatchMode}
          title={isBatchMode ? 'Switch to swipe mode' : 'Switch to batch mode'}
          className="px-xs h-7 text-xs"
        >
          <FaLayerGroup className="text-xs" />
          <span>Batch</span>
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR: Docked on Left (>= lg) ── */}
      <aside
        aria-label="Main Sidebar"
        className="border-border-default bg-surface-subtle p-md sticky top-0 left-0 z-20 hidden h-screen w-80 shrink-0 flex-col border-r lg:flex lg:w-96"
      >
        {/* App Header & Refresh */}
        <header className="border-border-subtle pb-sm flex shrink-0 items-center justify-between border-b">
          <div className="gap-xs flex items-center">
            <span className="text-text-primary text-base font-bold tracking-tight">Uncluttered</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Clear PWA cache & reload"
            aria-label="Clear PWA cache & reload"
            className="rounded-control p-xs text-text-muted hover:bg-surface-card hover:text-text-primary flex cursor-pointer items-center justify-center transition-colors disabled:opacity-50"
          >
            <FaRedo className={twMerge('text-xs', refreshing && 'animate-spin')} />
          </button>
        </header>

        {/* Primary Navigation Tabs */}
        <nav aria-label="Desktop Navigation" className="segmented-nav mt-sm mb-md shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-current={isCategorizeView ? 'page' : undefined}
            className="segmented-tab flex-1"
          >
            <FaTags className="text-xs" />
            <span>Categorize</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/inbox')}
            aria-current={isInboxView ? 'page' : undefined}
            className="segmented-tab flex-1"
          >
            <FaMailBulk className="text-xs" />
            <span>Inbox</span>
          </button>
        </nav>

        {/* Toolbar Controls (Sync, Reclassify, Batch) */}
        <div className="mb-md border-border-subtle pb-sm flex shrink-0 items-center justify-between border-b">
          <span className="text-text-secondary text-xs font-semibold">Actions</span>
          {toolbarButtons}
        </div>

        {/* Scrollable Category Explorer */}
        <nav aria-label="Categories Explorer" className="space-y-md pr-xs flex-1 overflow-y-auto overscroll-contain">
          {renderContent()}
        </nav>
      </aside>

      {/* ── MOBILE: Bottom-Right FAB + BottomSheet (< lg) ── */}
      <div className="lg:hidden">
        <Fab
          icon={<FaTags className="text-lg" />}
          openIcon={<FaTimes className="text-lg" />}
          isOpen={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={!enabled}
          aria-label={isOpen ? 'Close categories' : 'Open categories'}
          title={isOpen ? 'Close categories' : 'Open categories'}
        />

        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Categories" headerActions={toolbarButtons}>
          {renderContent()}
        </BottomSheet>
      </div>
    </>
  );
}
