import { FaArchive, FaTrash } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { formatCategory } from 'utilities/util';

import { AppSidebar } from 'components/AppSidebar';
import { EmailBundle } from 'components/EmailBundle';
import { MobileNavHeader } from 'components/MobileNavHeader';
import { Button } from 'components/ui/Button';
import { EmptyState } from 'components/ui/EmptyState';
import { PageHeader } from 'components/ui/PageHeader';
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

  const categories = rawCategories.filter((c) => categoryCount[c.key] > 0).sort((a, b) => a.urgency - b.urgency);

  const urlCategory = searchParams.get('category');
  const importantCount = emails.filter((e) => e.important).length;
  const isImportantFilter = urlCategory === 'IMPORTANT' && importantCount > 0;

  const defaultCategory = categories[0]?.key || 'PERSONAL';
  const validCategory = urlCategory && categories?.find((c) => c.key === urlCategory);

  const filter = isImportantFilter ? 'IMPORTANT' : validCategory ? urlCategory : defaultCategory;

  const visibleEmails = emails
    .filter((email) =>
      filter === 'IMPORTANT' ? email.important : !filter || (email.userOverrideCategory || email.aiCategory) === filter
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, breakpoint === 'sm' ? 10 : breakpoint === 'md' || breakpoint === 'lg' ? 14 : 15);

  const nonImportantVisible = visibleEmails.filter((e) => !e.important);

  const headerTitle = filter === 'IMPORTANT' ? 'Important' : filter ? formatCategory(filter) : 'Inbox';

  const totalFilteredCount = filter === 'IMPORTANT' ? importantCount : categoryCount[filter] || 0;

  return (
    <div className="bg-surface-canvas flex min-h-screen flex-col lg:flex-row">
      {/* Mobile Top Navigation Bar (< lg) */}
      <MobileNavHeader />

      {/* Unified Left Sidebar (>= lg) + Mobile FAB (< lg) */}
      <AppSidebar
        categories={categories}
        categoryCounts={categoryCount}
        activeCategory={filter}
        importantCount={importantCount}
        onSelectCategory={(category) => setSearchParams({ category })}
      />

      {/* Main Content Workspace */}
      <main>
        <div className="gap-md flex w-full max-w-5xl flex-col">
          {/* Standardized PageHeader */}
          <PageHeader
            title={headerTitle}
            count={totalFilteredCount}
            description={`Showing ${visibleEmails.length} of ${totalFilteredCount} emails. Tap an email to read, or manage below.`}
            actions={
              nonImportantVisible.length > 0 ? (
                <div className="gap-xs flex items-center">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      actions.batchArchive(nonImportantVisible.map((email) => email.id));
                    }}
                    title={`Archive ${nonImportantVisible.length} emails`}
                  >
                    <FaArchive className="text-xs" />
                    <span>Archive All ({nonImportantVisible.length})</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      actions.batchTrash(nonImportantVisible.map((email) => email.id));
                    }}
                    title={`Trash ${nonImportantVisible.length} emails`}
                  >
                    <FaTrash className="text-xs" />
                    <span>Trash All ({nonImportantVisible.length})</span>
                  </Button>
                </div>
              ) : null
            }
          />

          {/* Email Feed */}
          {visibleEmails.length > 0 ? (
            <EmailBundle emails={visibleEmails} actions={actions} categories={categories} layoutKey={filter} />
          ) : (
            <EmptyState
              icon="🎉"
              title={`All done — no more emails in ${headerTitle}!`}
              description="Select another category from the sidebar to review more emails."
            />
          )}
        </div>
      </main>
    </div>
  );
}
