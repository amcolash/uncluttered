import { FaArchive, FaQuestion, FaTrash } from 'react-icons/fa';

import type { Email, EmailActions } from 'hooks/useEmails';

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
  return (
    <div className="group relative h-28 break-inside-avoid rounded-lg bg-slate-700 p-4">
      <p className="line-clamp-1 text-sm font-semibold break-all text-white">{email.sender}</p>
      <p className="mb-2 text-xs text-slate-400">{new Date(email.date).toLocaleString()}</p>
      <p className="line-clamp-2 text-sm break-all text-slate-400">{email.subject}</p>

      {/* TODO: Figure out mobile - likely swipes */}

      <div className="absolute right-2 bottom-2 left-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="warning"
          size="sm"
          className="size-6 p-1"
          onClick={() => actions.categorize(email.id, 'UNKNOWN')}
        >
          <FaQuestion className="text-slate-700" />
        </Button>

        <div className="flex-1"></div>

        <Button variant="success" size="sm" className="size-6 p-1" onClick={() => actions.archive(email.id)}>
          <FaArchive className="text-slate-700" />
        </Button>

        <Button variant="danger" size="sm" className="size-6 p-1" onClick={() => actions.trash(email.id)}>
          <FaTrash className="text-slate-700" />
        </Button>
      </div>
    </div>
  );
}
