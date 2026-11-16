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
      <div className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-slate-800/90 p-4 shadow-md transition-all hover:border-slate-500 hover:shadow-lg">
        {/* Clickable card body to inspect full email */}
        <div className="cursor-pointer" onClick={() => setModalOpen(true)}>
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-300" title={email.sender}>
              {email.sender}
            </p>
            <span className="shrink-0 text-xs text-slate-400">
              {new Date(email.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm font-bold text-white leading-snug" title={email.subject}>
            {email.subject}
          </p>

          <p className="mt-2 line-clamp-3 text-xs text-slate-400 leading-relaxed">{email.snippet}</p>

          <div className="mt-3 flex items-center justify-between">
            <Badge variant="primary" className="text-xs">
              {formatCategory(category)}
            </Badge>
          </div>
        </div>

        {/* Action Bar: Category Select dropdown + Skip + Approve */}
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-700/60 pt-3">
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
              className="h-7 flex-1 min-w-0 cursor-pointer truncate rounded-lg border border-slate-600 bg-slate-700/90 px-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-400 focus:border-indigo-400 focus:outline-none"
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
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(email.id);
            }}
            title="Skip / defer this email to the end"
            className="h-7 px-2 shrink-0"
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
            className="h-7 px-2 shrink-0 font-semibold"
          >
            <FaCheck className="text-xs" />
            <span className="hidden sm:inline">Approve</span>
          </Button>
        </div>
      </div>

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
