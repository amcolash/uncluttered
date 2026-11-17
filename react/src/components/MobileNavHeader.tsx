import { useState } from 'react';
import { FaMailBulk, FaRedo, FaTags } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { clearPwaCacheAndReload } from 'utilities/util';

export function MobileNavHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const isCategorize =
    location.pathname === '/' || location.pathname === '/batch' || location.pathname.startsWith('/categorize');
  const isInbox = location.pathname.startsWith('/inbox');

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearPwaCacheAndReload();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-surface-subtle/90 px-md py-xs backdrop-blur-md lg:hidden">
      {/* Brand */}
      <span className="text-sm font-bold tracking-tight text-text-primary">Uncluttered</span>

      {/* Segmented Tab Navigation */}
      <nav aria-label="Mobile Navigation" className="segmented-nav">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-current={isCategorize ? 'page' : undefined}
          className="segmented-tab"
        >
          <FaTags className="text-xs" />
          <span>Categorize</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/inbox')}
          aria-current={isInbox ? 'page' : undefined}
          className="segmented-tab"
        >
          <FaMailBulk className="text-xs" />
          <span>Inbox</span>
        </button>
      </nav>

      {/* Refresh Action */}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        title="Clear PWA cache & reload"
        aria-label="Clear PWA cache & reload"
        className="flex cursor-pointer items-center justify-center rounded-control p-xs text-text-muted transition-colors hover:bg-surface-card hover:text-text-primary disabled:opacity-50"
      >
        <FaRedo className={twMerge('text-xs', refreshing && 'animate-spin')} />
      </button>
    </header>
  );
}
