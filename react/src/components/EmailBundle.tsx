import { useState } from 'react';
import { FaArchive, FaQuestion, FaTrash } from 'react-icons/fa';

import type { Email, EmailActions } from 'hooks/useEmails';

import { EmailModal } from './EmailModal';
import { Button } from './ui/Button';

export function EmailBundle({ emails, actions }: { emails: Email[]; actions: EmailActions }) {
  return (
    <div className="w-full max-w-4xl break-inside-avoid space-y-4 sm:columns-2 lg:columns-3">
      {emails.map((email) => (
        <EmailCard key={email.id} email={email} actions={actions} />
      ))}
    </div>
  );
}

function EmailCard({ email, actions }: { email: Email; actions: EmailActions }) {
  const [modal, setModal] = useState(false);

  return (
    <>
      <div className="group relative">
        <Button
          className="grid h-28 w-full break-inside-avoid justify-start rounded-lg bg-slate-700 p-4"
          onClick={() => setModal(true)}
        >
          <p className="line-clamp-1 text-sm font-semibold break-all text-white">{email.sender}</p>
          <p className="mb-2 text-xs text-slate-400">{new Date(email.date).toLocaleString()}</p>
          <p className="line-clamp-2 text-sm break-all text-slate-400">{email.subject}</p>
        </Button>

        {/* TODO: Figure out mobile - likely swipes */}

        <div className="pointer-events-none absolute right-2 bottom-2 left-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="warning"
            size="sm"
            className="size-6 p-1"
            onClick={() => actions.categorize(email.id, 'UNKNOWN')}
          >
            <FaQuestion className="pointer-events-auto text-slate-700" />
          </Button>

          <div className="flex-1"></div>

          <Button variant="success" size="sm" className="size-6 p-1" onClick={() => actions.archive(email.id)}>
            <FaArchive className="pointer-events-auto text-slate-700" />
          </Button>

          <Button variant="danger" size="sm" className="size-6 p-1" onClick={() => actions.trash(email.id)}>
            <FaTrash className="pointer-events-auto text-slate-700" />
          </Button>
        </div>
      </div>

      {modal && <EmailModal email={email} onClose={() => setModal(false)} />}
    </>
  );
}
