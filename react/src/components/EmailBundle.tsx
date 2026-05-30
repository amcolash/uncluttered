import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FaArchive, FaQuestion, FaStar, FaTrash } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

import type { Email, EmailActions } from 'hooks/useEmails';

import { EmailModal } from './EmailModal';
import { Button } from './ui/Button';

export function EmailBundle({
  emails,
  actions,
  layoutKey,
}: {
  emails: Email[];
  actions: EmailActions;
  layoutKey?: string;
}) {
  return (
    <div className="grid w-full max-w-4xl break-inside-avoid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence key={layoutKey}>
        {emails.map((email) => (
          <EmailCard key={email.id} email={email} actions={actions} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const buttonClasses = 'pointer-events-auto size-6 p-1';
const iconClasses = 'text-slate-300 drop-shadow drop-shadow-slate-800/40';

function EmailCard({ email, actions }: { email: Email; actions: EmailActions }) {
  const [modal, setModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.15 } }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, layout: { duration: 0.15 } }}
        layout
        className="group relative"
        key={email.id}
      >
        <Button
          className="grid h-28 w-full cursor-auto break-inside-avoid justify-start rounded-lg bg-slate-700 p-4 text-left transition-all group-hover:brightness-50"
          onClick={() => setModal(true)}
          variant="ghost"
        >
          <p className="group-hover:blur-px line-clamp-1 text-sm font-semibold break-all text-white">{email.sender}</p>
          <p className="group-hover:blur-px mb-2 text-xs text-slate-400">{new Date(email.date).toLocaleString()}</p>
          <p className="group-hover:blur-px line-clamp-2 text-sm break-all text-slate-400">{email.subject}</p>
        </Button>

        {/* TODO: Figure out mobile - likely swipes */}

        <Button
          variant="primary"
          size="sm"
          className="absolute top-2 right-2 size-6 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => actions.markImportant(email.id, !email.important)}
        >
          <FaStar className={twMerge(iconClasses, email.important && 'text-yellow-400')} />
        </Button>

        {email.important && (
          <FaStar
            className={twMerge(
              iconClasses,
              'pointer-events-none absolute top-3.5 right-3.5 size-3 text-yellow-400 opacity-100'
            )}
          />
        )}

        <div className="pointer-events-none absolute right-2 bottom-2 left-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="warning"
            size="sm"
            className={buttonClasses}
            onClick={() => actions.categorize(email.id, 'UNKNOWN')}
          >
            <FaQuestion className={iconClasses} />
          </Button>

          <div className="flex-1"></div>

          <Button variant="success" size="sm" className={buttonClasses} onClick={() => actions.archive(email.id)}>
            <FaArchive className={iconClasses} />
          </Button>

          <Button variant="danger" size="sm" className={buttonClasses} onClick={() => actions.trash(email.id)}>
            <FaTrash className={iconClasses} />
          </Button>
        </div>
      </motion.div>

      {modal && <EmailModal email={email} actions={actions} onClose={() => setModal(false)} />}
    </>
  );
}
