import { useEffect, useMemo, useState } from 'react';
import { FaCheckDouble, FaTimes, FaUndo } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { formatCategory } from 'utilities/util';

import { BatchCard } from 'components/BatchCard';
import { CategorizeMenu } from 'components/CategorizeMenu';
import { EmailCard } from 'components/EmailCard';
import { Nav } from 'components/Nav';
import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
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
  }, [actions, actions.undo]);

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
    <div className="flex justify-between p-2 sm:p-0">
      <Nav />

      <div className="flex flex-1 flex-col items-center gap-8 p-4 pt-6 sm:p-8">
        {emails.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-5xl">🎉</span>
            <p className="text-xl font-bold text-white">All done — no more emails to review!</p>
            <p className="text-sm text-slate-400">All incoming emails have been validated or categorized.</p>
          </div>
        ) : isBatchMode ? (
          /* ── BATCH MODE ── */
          <div className="flex w-full max-w-6xl flex-col gap-6">
            {/* Header & Controls */}
            <motion.div
              key={`header-${activeBatchCategory}`}
              initial={{ borderColor: 'rgba(99, 102, 241, 0.8)' }}
              animate={{ borderColor: 'rgba(51, 65, 85, 0.8)' }}
              transition={{ duration: 0.8 }}
              className="flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">
                      Batch Categorize {emails.length > 0 && `(${emails.length} remaining)`}
                    </h1>
                    <AnimatePresence mode="wait">
                      {activeBatchCategory && (
                        <motion.div
                          key={activeBatchCategory}
                          initial={{ opacity: 0, scale: 0.8, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge variant="primary" className="px-3 py-1 text-sm font-semibold">
                            {formatCategory(activeBatchCategory)}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeBatchCategory}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 text-xs text-slate-400 sm:text-sm"
                    >
                      Showing {activeBatchEmails.length} of {totalPendingInActiveBatch} pending emails for{' '}
                      <span className="font-semibold text-slate-200">
                        {activeBatchCategory ? formatCategory(activeBatchCategory) : 'None'}
                      </span>
                      . Review together and batch approve or skip individually.
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
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
                    className="font-semibold shadow-md"
                  >
                    <FaCheckDouble className="text-xs" />
                    <span>Approve Batch ({activeBatchEmails.length})</span>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Batch Cards Grid (6-8 cards) with Category Change Animation */}
            <AnimatePresence mode="wait">
              {activeBatchEmails.length > 0 ? (
                <motion.div
                  key={activeBatchCategory}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="flex flex-col gap-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
                    <div className="flex justify-center pt-4 pb-8">
                      <Button
                        variant="success"
                        size="md"
                        onClick={handleBatchApprove}
                        className="px-6 py-2.5 font-semibold shadow-lg"
                      >
                        <FaCheckDouble />
                        <span>Approve Batch ({activeBatchEmails.length})</span>
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-category"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400"
                >
                  No more pending emails in this category.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ── SINGLE SWIPE MODE ── */
          <>
            <div className="grid w-full max-w-4xl gap-4">
              <h1 className="text-2xl font-bold text-white">
                Review emails {emails.length > 0 && `(${emails.length})`}
              </h1>
              <p className="text-sm text-slate-400">
                Swipe right to confirm, swipe left to defer to the end of the pile. Use a category button to
                re-categorize.
              </p>

              <Button variant="secondary" size="sm" onClick={actions.undo} disabled={!canUndo} className="w-fit">
                <FaUndo className="text-xs" />
                <span>Undo</span>
              </Button>
            </div>

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
                    className="border border-slate-900 bg-slate-700 p-4"
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
          </>
        )}
      </div>

      <CategorizeMenu
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
        aiCategory={isBatchMode ? undefined : current?.aiCategory}
        userOverrideCategory={isBatchMode ? undefined : current?.userOverrideCategory}
        suggestions={isBatchMode ? [] : suggestions}
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => navigate(isBatchMode ? '/' : '/batch')}
      />
    </div>
  );
}
