import { FaMailBulk, FaTags } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

const links = [
  { name: 'Categorize', url: '/categorize', icon: <FaTags /> },
  { name: 'Inbox', url: '/inbox', icon: <FaMailBulk /> },
];

export function Nav() {
  return (
    <nav className="absolute top-4 right-4">
      <ul className="flex items-center">
        {links.map((link) => {
          const active = window.location.pathname === link.url;
          return (
            <li
              key={link.url}
              className={twMerge(
                'ring ring-slate-700 transition-colors first:rounded-l-lg last:rounded-r-lg',
                active && 'bg-slate-300 text-slate-900',
                !active && 'text-slate-300 hover:bg-slate-700/50'
              )}
            >
              {active ? (
                <span className="block p-2">{link.icon}</span>
              ) : (
                <a href={link.url} className="block p-2">
                  {link.icon}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
