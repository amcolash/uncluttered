import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaArchive, FaExternalLinkAlt, FaQuestion, FaStar, FaTimes, FaTrash } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API, formatCategory } from 'utilities/util';

import type { Category, Email, EmailActions } from 'hooks/useEmails';

import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

const iconClasses = 'pointer-events-auto text-slate-300 drop-shadow drop-shadow-slate-800/40';
const containerClass = 'mt-6 flex-1 overflow-auto rounded-lg bg-slate-100 p-4';

export interface EmailModalProps {
  email: Email;
  onClose: () => void;
  actions?: EmailActions;
  categories?: Category[];
  onCategorize?: (id: string, category: string) => void;
}

export function EmailModal({
  email,
  onClose,
  actions,
  categories = [],
  onCategorize,
}: EmailModalProps) {
  const [data, setData] = useState<{ html: string }>({ html: '' });
  const [loadedCategories, setLoadedCategories] = useState<Category[]>(categories);

  useEffect(() => {
    fetch(`${API}/api/emails/${email.id}`)
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(() => setData({ html: '' }));
  }, [email.id]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLoadedCategories(categories);
    } else {
      fetch(`${API}/api/categories`)
        .then((res) => res.json())
        .then((cats) => {
          if (Array.isArray(cats)) {
            setLoadedCategories(
              cats.map((c) => ({
                key: c.key,
                description: c.description || '',
                label: formatCategory(c.key),
                urgency: c.urgency ?? 3,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [categories]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  const currentCategory = email.userOverrideCategory ?? email.aiCategory;

  const sortedCategories = useMemo(() => {
    return [...loadedCategories]
      .filter((c) => c.key !== 'UNKNOWN' && c.key !== currentCategory)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [loadedCategories, currentCategory]);

  const handleSelectCategory = (newCat: string) => {
    if (!newCat) return;
    if (onCategorize) {
      onCategorize(email.id, newCat);
    } else if (actions?.categorize) {
      actions.categorize(email.id, newCat);
    } else {
      fetch(`${API}/api/emails/${email.id}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCat, validated: true }),
      }).catch(console.error);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-20 m-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-screen w-screen flex-col gap-1 overflow-y-auto bg-slate-800 p-6 sm:h-[80vh] sm:max-w-[min(90vw,56rem)] sm:rounded-lg">
        <div className="flex flex-wrap-reverse justify-end gap-4">
          <p className="line-clamp-1 text-lg font-semibold break-all text-white">{email.sender}</p>
          <div className="flex-1"></div>
          <div className="flex flex-wrap items-center gap-2">
            {sortedCategories.length > 0 && (
              <select
                value=""
                onChange={(e) => handleSelectCategory(e.target.value)}
                title="One-off categorize: move this email to another category"
                aria-label="Change category for this email"
                className="h-8 cursor-pointer rounded-lg border border-slate-600 bg-slate-700/90 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-slate-400 focus:border-indigo-400 focus:outline-none"
              >
                <option value="" disabled>
                  Move to...
                </option>
                {sortedCategories.map((c) => (
                  <option key={c.key} value={c.key} className="bg-slate-800 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            )}

            {actions && (
              <>
                <Button variant="primary" onClick={() => actions.markImportant(email.id, !email.important)}>
                  <FaStar className={twMerge(iconClasses, email.important && 'text-yellow-400')} />
                </Button>

                <Button variant="warning" onClick={() => actions.categorize(email.id, 'UNKNOWN')}>
                  <FaQuestion className={iconClasses} />
                </Button>

                <Button variant="success" onClick={() => actions.archive(email.id)}>
                  <FaArchive className={iconClasses} />
                </Button>

                <Button variant="danger" onClick={() => actions.trash(email.id)}>
                  <FaTrash className={iconClasses} />
                </Button>
              </>
            )}

            <div className="m-1"></div>

            <a href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" role="none">
                <FaExternalLinkAlt />
              </Button>
            </a>
            <Button variant="secondary" onClick={onClose}>
              <FaTimes />
            </Button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Badge variant="primary" className="text-xs">
            {formatCategory(currentCategory)}
          </Badge>
          <span className="text-xs text-slate-400">{new Date(email.date).toLocaleString()}</span>
        </div>
        <p className="line-clamp-2 break-all text-sm font-semibold text-white">{email.subject}</p>

        {data.html && <iframe className={containerClass} srcDoc={data.html}></iframe>}
        {!data.html && (
          <div className={twMerge(containerClass, 'flex items-center justify-center')}>
            <Spinner size="xl" />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
