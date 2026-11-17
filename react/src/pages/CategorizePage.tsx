import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { FaCheckDouble, FaTimes, FaUndo } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCategory } from 'utilities/util';

import { AppSidebar } from 'components/AppSidebar';
import { BatchCard } from 'components/BatchCard';
import { EmailCard } from 'components/EmailCard';
import { MobileNavHeader } from 'components/MobileNavHeader';
import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Button } from 'components/ui/Button';
import { EmptyState } from 'components/ui/EmptyState';
import { PageHeader } from 'components/ui/PageHeader';
import { useEmails } from 'hooks/useEmails';
import { useSuggestions } from 'hooks/useSuggestions';

export function CategorizePage() {
  const { emails, categories, categoryCounts, canUndo, actions } = useEmails(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isBatchMode = location.pathname === '/batch' || location.pathname.endsWith('/batch');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Single card mode stack
  const emailStack = emails.slice(0, 5);
  const current = emailStack[0];
  const suggestions = useSuggestions(current);

  // Group unvalidated emails by predicted category for batch mode
  const unvalidatedByCategory = useMemo(() => {
    const map = new Map<string, typeof emails>();
    for (const email of emails) {
      const cat = email.userOverrideCategory || email.aiCategory || 'UNKNOWN';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(email);
    }
    return map;
  }, [emails]);

  // Pending category counts for unvalidated emails in batch mode
  const pendingCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const email of emails) {
      const cat = email.userOverrideCategory || email.aiCategory || 'UNKNOWN';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [emails]);

  // Keep currently selected category locked until it has 0 emails left, then advance to next
  useEffect(() => {
    if (!isBatchMode) return;
    const currentCount = selectedCategory ? pendingCategoryCounts[selectedCategory] || 0 : 0;
    if (currentCount === 0) {
      const nextCategory = Object.entries(pendingCategoryCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0];
      setSelectedCategory(nextCategory ? nextCategory[0] : null);
    }
  }, [isBatchMode, selectedCategory, pendingCategoryCounts]);

  // Active category being reviewed in batch mode
  const activeBatchCategory = useMemo(() => {
    if (selectedCategory && (pendingCategoryCounts[selectedCategory] || 0) > 0) {
      return selectedCategory;
    }
    const topCategory = Object.entries(pendingCategoryCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0];
    return topCategory ? topCategory[0] : null;
  }, [selectedCategory, pendingCategoryCounts]);

  const activeBatchEmails = useMemo(() => {
    if (!activeBatchCategory) return [];
    return (unvalidatedByCategory.get(activeBatchCategory) ?? []).slice(0, 8);
  }, [activeBatchCategory, unvalidatedByCategory]);

  const totalPendingInActiveBatch = activeBatchCategory
    ? (unvalidatedByCategory.get(activeBatchCategory)?.length ?? 0)
    : 0;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') actions.undo();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [actions]);

  const handleBatchApprove = async () => {
    const ids = activeBatchEmails.map((e) => e.id);
    if (ids.length > 0) {
      await actions.batchConfirm(ids);
    }
  };

  const handleBatchSkip = async () => {
    for (const email of activeBatchEmails) {
      await actions.defer(email.id);
    }
  };

  return (
    <div className="bg-surface-canvas flex min-h-screen flex-col lg:flex-row">
      {/* Mobile Top Navigation Bar (< lg) */}
      <MobileNavHeader />

      {/* Unified Left Sidebar (>= lg) + Mobile FAB (< lg) */}
      <AppSidebar
        categories={categories}
        categoryCounts={isBatchMode ? pendingCategoryCounts : categoryCounts}
        enabled={isBatchMode ? true : current !== undefined}
        onSelectCategory={(category) => {
          if (isBatchMode) {
            setSelectedCategory(category);
          } else if (current) {
            actions.categorize(current.id, category);
          }
        }}
        activeCategory={isBatchMode ? activeBatchCategory : current?.userOverrideCategory || current?.aiCategory}
        suggestions={isBatchMode ? [] : suggestions}
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => navigate(isBatchMode ? '/' : '/batch')}
        showReclassify={true}
      />

      {/* Main Content Workspace */}
      <main>
        {emails.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="All done — no more emails to review!"
            description="All incoming emails have been validated or categorized."
            className="my-16"
          />
        ) : isBatchMode ? (
          /* ── BATCH MODE ── */
          <div className="gap-md sm:gap-lg flex w-full max-w-6xl flex-col">
            {/* Standardized PageHeader */}
            <PageHeader
              title="Batch Categorize"
              count={emails.length > 0 ? `${emails.length} remaining` : undefined}
              badge={
                activeBatchCategory ? { label: formatCategory(activeBatchCategory), variant: 'primary' } : undefined
              }
              description={
                <span>
                  Showing {activeBatchEmails.length} of {totalPendingInActiveBatch} pending emails for{' '}
                  <span className="text-text-primary font-semibold">
                    {activeBatchCategory ? formatCategory(activeBatchCategory) : 'None'}
                  </span>
                  . Review together and batch approve or skip individually.
                </span>
              }
              actions={
                <div className="gap-xs sm:gap-sm flex flex-wrap items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={actions.undo}
                    disabled={!canUndo}
                    title="Undo last action"
                  >
                    <FaUndo className="text-xs" />
                    <span>Undo</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBatchSkip}
                    disabled={activeBatchEmails.length === 0}
                    title="Skip all displayed cards in this batch"
                  >
                    <FaTimes className="text-xs" />
                    <span>Skip Batch</span>
                  </Button>

                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleBatchApprove}
                    disabled={activeBatchEmails.length === 0}
                    title="Approve all displayed cards in this batch"
                  >
                    <FaCheckDouble className="text-xs" />
                    <span>Approve Batch ({activeBatchEmails.length})</span>
                  </Button>
                </div>
              }
            />

            {/* Batch Cards Grid with Category Transition */}
            <AnimatePresence mode="wait">
              {activeBatchEmails.length > 0 ? (
                <motion.div
                  key={activeBatchCategory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="gap-md flex flex-col"
                >
                  <div className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                    {activeBatchEmails.map((email) => (
                      <BatchCard
                        key={email.id}
                        email={email}
                        categories={categories}
                        onApprove={(id) => actions.confirm(id)}
                        onSkip={(id) => actions.defer(id)}
                        onCategorize={(id, newCat) => actions.categorize(id, newCat)}
                      />
                    ))}
                  </div>

                  {/* Bottom Approve Bar for convenience */}
                  {activeBatchEmails.length > 4 && (
                    <div className="pt-md pb-xl flex justify-center">
                      <Button
                        variant="success"
                        size="md"
                        onClick={handleBatchApprove}
                        className="px-lg py-sm shadow-card font-semibold"
                      >
                        <FaCheckDouble />
                        <span>Approve Batch ({activeBatchEmails.length})</span>
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <EmptyState
                  icon="✨"
                  title="No pending emails in this category"
                  description="Select another category from the sidebar or wait for new incoming emails."
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ── SINGLE SWIPE MODE ── */
          <div className="gap-md flex w-full max-w-4xl flex-col items-center">
            <PageHeader
              title="Review Emails"
              count={emails.length}
              description="Swipe right to confirm, swipe left to defer to the end of the pile. Use a category button to re-categorize."
              actions={
                <Button variant="secondary" size="sm" onClick={actions.undo} disabled={!canUndo}>
                  <FaUndo className="text-xs" />
                  <span>Undo</span>
                </Button>
              }
            />

            {current && (
              <CardStack>
                {emailStack.map((email, i) => (
                  <SwipeCard
                    key={email.id}
                    onSwipe={(dir) => {
                      if (document.activeElement) (document.activeElement as HTMLElement).blur();

                      if (dir === 'right') {
                        actions.confirm(email.id);
                      } else {
                        actions.defer(email.id);
                      }
                    }}
                    index={i}
                    className="p-md"
                  >
                    <EmailCard
                      email={email}
                      suggestions={email.id === current?.id ? suggestions : []}
                      categorize={actions.categorize}
                    />
                  </SwipeCard>
                ))}
              </CardStack>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
