import { useState } from 'react';
import { FaMailBulk, FaRedo, FaTags } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { clearPwaCacheAndReload } from 'utilities/util';

const links = [
  { name: 'Categorize', url: '/', icon: <FaTags /> },
  { name: 'Inbox', url: '/inbox', icon: <FaMailBulk /> },
];

export function Nav() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearPwaCacheAndReload();
  };

  return (
    <nav className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-20 rounded-lg bg-slate-800 shadow-lg">
      <ul className="flex items-center">
        {links.map((link) => {
          const active =
            window.location.pathname === link.url ||
            (link.url === '/' && (window.location.pathname === '/batch' || window.location.pathname.startsWith('/categorize')));
          return (
            <li
              key={link.url}
              className={twMerge(
                'ring ring-slate-700 transition-colors first:rounded-l-lg',
                active && 'bg-slate-300 text-slate-900',
                !active && 'text-slate-300 hover:bg-slate-700/50'
              )}
            >
              {active ? (
                <span className="block p-3">{link.icon}</span>
              ) : (
                <a href={link.url} className="block p-3">
                  {link.icon}
                </a>
              )}
            </li>
          );
        })}

        <li className="text-slate-300 ring ring-slate-700 transition-colors last:rounded-r-lg hover:bg-slate-700/50">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Clear PWA cache & refresh"
            aria-label="Clear PWA cache and refresh"
            className="block cursor-pointer p-3 text-slate-300 hover:text-white disabled:opacity-50"
          >
            <FaRedo className={refreshing ? 'animate-spin' : ''} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
