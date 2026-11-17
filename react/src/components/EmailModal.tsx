import { useEffect, useMemo, useState } from 'react';
import { FaArchive, FaExternalLinkAlt, FaQuestion, FaStar, FaTrash } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API, formatCategory } from 'utilities/util';

import type { Category, Email, EmailActions } from 'hooks/useEmails';

import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';

export interface EmailModalProps {
  email: Email;
  onClose: () => void;
  actions?: EmailActions;
  categories?: Category[];
  onCategorize?: (id: string, category: string) => void;
}

export function EmailModal({ email, onClose, actions, categories = [], onCategorize }: EmailModalProps) {
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

  const titleNode = (
    <div className="gap-2xs flex flex-col truncate">
      <div className="gap-xs flex items-center">
        <span className="text-text-primary truncate text-sm font-bold sm:text-base">{email.sender}</span>
        <Badge variant="primary" className="text-xs">
          {formatCategory(currentCategory)}
        </Badge>
      </div>
      <span className="text-text-muted text-xs">{new Date(email.date).toLocaleString()}</span>
    </div>
  );

  const headerActionsNode = (
    <div className="gap-xs flex flex-wrap items-center">
      {sortedCategories.length > 0 && (
        <select
          value=""
          onChange={(e) => handleSelectCategory(e.target.value)}
          title="Move this email to another category"
          aria-label="Change category for this email"
        >
          <option value="" disabled>
            Move to...
          </option>
          {sortedCategories.map((c) => (
            <option key={c.key} value={c.key} className="bg-surface-card text-text-primary">
              {c.label}
            </option>
          ))}
        </select>
      )}

      {actions && (
        <>
          <Button
            variant={email.important ? 'warning' : 'secondary'}
            size="sm"
            onClick={() => actions.markImportant(email.id, !email.important)}
            title={email.important ? 'Remove star' : 'Star as important'}
            className="flex h-7 w-7 items-center justify-center p-0"
          >
            <FaStar className={twMerge('text-xs', email.important ? 'text-surface-canvas' : 'text-status-warning')} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              actions.categorize(email.id, 'UNKNOWN');
              onClose();
            }}
            title="Mark Unknown"
            className="flex h-7 w-7 items-center justify-center p-0"
          >
            <FaQuestion className="text-xs" />
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={() => {
              actions.archive(email.id);
              onClose();
            }}
            title="Archive email"
            className="flex h-7 w-7 items-center justify-center p-0"
          >
            <FaArchive className="text-xs" />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              actions.trash(email.id);
              onClose();
            }}
            title="Trash email"
            className="flex h-7 w-7 items-center justify-center p-0"
          >
            <FaTrash className="text-xs" />
          </Button>
        </>
      )}

      <a
        href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Gmail"
      >
        <Button variant="secondary" size="sm" className="flex h-7 w-7 items-center justify-center p-0">
          <FaExternalLinkAlt className="text-xs" />
        </Button>
      </a>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titleNode}
      headerActions={headerActionsNode}
      size="full"
      className="h-[90vh] sm:h-[85vh]"
    >
      <div className="gap-sm flex h-full flex-col">
        <h2 className="text-text-primary text-base font-bold">{email.subject}</h2>

        {data.html ? (
          <iframe
            title="Email preview"
            className="rounded-control border-border-default h-full min-h-[350px] w-full flex-1 border bg-white"
            srcDoc={data.html}
          />
        ) : (
          <div className="rounded-control border-border-default bg-surface-subtle p-xl flex flex-1 items-center justify-center border">
            <Spinner size="xl" />
          </div>
        )}
      </div>
    </Modal>
  );
}
