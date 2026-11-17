import { useMemo, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { formatCategory } from 'utilities/util';

import type { Category, Email } from 'hooks/useEmails';

import { EmailModal } from './EmailModal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface BatchCardProps {
  email: Email;
  categories?: Category[];
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onCategorize?: (id: string, category: string) => void;
}

export function BatchCard({ email, categories = [], onApprove, onSkip, onCategorize }: BatchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const category = email.userOverrideCategory ?? email.aiCategory;

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((c) => c.key !== 'UNKNOWN' && c.key !== category)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, category]);

  return (
    <>
      <article
        aria-label={email.subject}
        className="email-card"
      >
        {/* Clickable card body to inspect full email */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalOpen(true);
            }
          }}
          className="cursor-pointer focus:outline-none"
        >
          {/* Header Row: Sender & Date */}
          <header className="email-card-header">
            <span className="email-card-sender" title={email.sender}>
              {email.sender}
            </span>
            <time dateTime={email.date}>
              {new Date(email.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </header>

          {/* Subject */}
          <h2 className="mt-xs line-clamp-2" title={email.subject}>
            {email.subject}
          </h2>

          {/* Snippet preview */}
          {email.snippet && <p className="email-card-snippet">{email.snippet}</p>}

          {/* Badge */}
          <div className="mt-sm flex items-center justify-between">
            <Badge variant="primary">{formatCategory(category)}</Badge>
          </div>
        </div>

        {/* Action Bar: Category Select dropdown + Skip + Approve */}
        <footer role="toolbar" aria-label="Card Actions" className="email-card-footer">
          {onCategorize && sortedCategories.length > 0 ? (
            <select
              value=""
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.value) {
                  onCategorize(email.id, e.target.value);
                }
              }}
              title="One-off categorize: move this email to another category"
              aria-label="Change category for this email"
              className="flex-1 min-w-0 truncate"
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
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(email.id);
            }}
            title="Skip / defer this email to the end"
            className="shrink-0"
          >
            <FaTimes className="text-xs" />
            <span className="hidden sm:inline">Skip</span>
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApprove(email.id);
            }}
            title="Approve category for this email"
            className="shrink-0 font-semibold"
          >
            <FaCheck className="text-xs" />
            <span className="hidden sm:inline">Approve</span>
          </Button>
        </footer>
      </article>

      {modalOpen && (
        <EmailModal
          email={email}
          categories={categories}
          onCategorize={onCategorize}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
