import type { Email } from 'hooks/useEmails';

export function EmailBundle({ emails }: { emails: Email[] }) {
  return (
    <div className="w-full max-w-4xl break-inside-avoid space-y-4 sm:columns-2 lg:columns-3">
      {emails.map((email) => (
        <div key={email.id} className="break-inside-avoid rounded-lg bg-slate-700 p-4">
          <p className="line-clamp-1 text-sm font-semibold break-all text-white">{email.sender}</p>
          <p className="line-clamp-1 text-sm break-all text-slate-400">{email.subject}</p>
        </div>
      ))}
    </div>
  );
}
