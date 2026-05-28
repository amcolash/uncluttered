import { useState } from 'react';

import { CategorySidebar } from 'components/CategorySidebar';
import { EmailBundle } from 'components/EmailBundle';
import { Menu } from 'components/Menu';
import { Nav } from 'components/Nav';
import { useEmails } from 'hooks/useEmails';

export function InboxPage() {
  const [filter, setFilter] = useState<string>();

  const { categories: rawCategories, emails } = useEmails(false);

  const categoryCount = emails.reduce(
    (acc, email) => {
      const cat = email.userOverrideCategory || email.aiCategory || 'uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const categories = rawCategories
    .filter((c) => categoryCount[c.key] > 0)
    .map((c) => ({ ...c, label: `(${categoryCount[c.key] || 0}) ${c.label}` }))
    .sort((a, b) => a.urgency - b.urgency);

  return (
    <div className="flex justify-center gap-8">
      <Menu>
        <CategorySidebar categories={categories} active={filter} onClick={(category) => setFilter(category)} />
      </Menu>

      <Nav />

      <div className="flex max-w-screen flex-1 flex-col items-center gap-20 p-8">
        <h1 className="mt-8 text-2xl font-bold text-white">Inbox</h1>

        {emails.length > 0 ? (
          <EmailBundle
            emails={emails
              .filter((email) => !filter || email.userOverrideCategory === filter || email.aiCategory === filter)
              .slice(0, 20)}
          />
        ) : (
          <p className="text-center text-lg text-white">
            <span>All done — no more emails to review.</span>
            <br />
            <br />
            <span className="text-4xl">🎉</span>
          </p>
        )}
      </div>
    </div>
  );
}
