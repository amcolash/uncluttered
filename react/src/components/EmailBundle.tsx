import { AnimatePresence } from 'motion/react';

import type { Category, Email, EmailActions } from 'hooks/useEmails';

import { InboxCard } from './InboxCard';

export function EmailBundle({
  emails,
  actions,
  categories = [],
  layoutKey,
}: {
  emails: Email[];
  actions: EmailActions;
  categories?: Category[];
  layoutKey?: string;
}) {
  return (
    <section
      aria-label="Email feed"
      className="gap-md grid w-full max-w-5xl break-inside-avoid pb-24 sm:grid-cols-2 sm:pb-0 lg:grid-cols-3"
    >
      <AnimatePresence key={layoutKey}>
        {emails.map((email) => (
          <InboxCard key={email.id} email={email} actions={actions} categories={categories} />
        ))}
      </AnimatePresence>
    </section>
  );
}
