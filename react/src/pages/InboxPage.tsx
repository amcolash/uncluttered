import { FaArchive, FaTrash } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { formatCategory } from 'utilities/util';

import { CategorySidebar } from 'components/CategorySidebar';
import { EmailBundle } from 'components/EmailBundle';
import { Menu } from 'components/Menu';
import { Nav } from 'components/Nav';
import { Button } from 'components/ui/Button';
import { useBreakpoint } from 'hooks/useBreakpoint';
import { useEmails } from 'hooks/useEmails';

export function InboxPage() {
  const breakpoint = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();

  const { categories: rawCategories, emails, actions } = useEmails(false);

  const categoryCount = emails.reduce(
    (acc, email) => {
      const cat = email.userOverrideCategory || email.aiCategory || 'UNKNOWN';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const categories = rawCategories
    .filter((c) => categoryCount[c.key] > 0)
    .map((c) => ({ ...c, label: `(${categoryCount[c.key] || 0}) ${c.label}` }))
    .sort((a, b) => a.urgency - b.urgency);

  const defaultCategory = categories[0]?.key || 'PERSONAL';
  const urlCategory = searchParams.get('category');
  const validCategory = urlCategory && categories?.find((c) => c.key === urlCategory);

  const filter = validCategory ? urlCategory : defaultCategory;

  const visibleEmails = emails
    .filter((email) => !filter || (email.userOverrideCategory || email.aiCategory) === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, breakpoint === 'sm' ? 10 : breakpoint === 'md' || breakpoint === 'lg' ? 14 : 15);

  return (
    <div className="flex justify-center gap-8">
      <Menu>
        <CategorySidebar
          categories={categories}
          active={filter}
          onClick={(category) => setSearchParams({ category })}
        />
      </Menu>

      <Nav />

      <div className="flex max-w-screen flex-1 flex-col items-center gap-12 p-8">
        <h1 className="mt-8 text-2xl font-bold text-white">
          {filter ? `${formatCategory(filter)} (${categoryCount[filter] || 0})` : 'All Emails'}
        </h1>

        <div className="sticky top-0 z-10 flex w-full max-w-4xl gap-4 bg-slate-800 py-4">
          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={() => {
              actions.batchArchive(visibleEmails.filter((e) => !e.important).map((email) => email.id));
            }}
          >
            <FaArchive className="text-slate-300 drop-shadow-lg drop-shadow-slate-800/50" />
          </Button>

          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => {
              actions.batchTrash(visibleEmails.filter((e) => !e.important).map((email) => email.id));
            }}
          >
            <FaTrash className="text-slate-300 drop-shadow-lg drop-shadow-slate-800/50" />
          </Button>
        </div>

        {emails.length > 0 ? (
          <EmailBundle emails={visibleEmails} actions={actions} layoutKey={filter} />
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
