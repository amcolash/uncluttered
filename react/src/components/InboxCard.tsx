import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FaArchive, FaQuestion, FaStar, FaTrash } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { formatCategory } from 'utilities/util';

import type { Category, Email, EmailActions } from 'hooks/useEmails';

import { EmailModal } from './EmailModal';
import { Badge } from './ui/Badge';

export interface InboxCardProps {
  email: Email;
  actions: EmailActions;
  categories?: Category[];
}

const SWIPE_THRESHOLD = 80;

export function InboxCard({ email, actions, categories = [] }: InboxCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const categoryKey = email.userOverrideCategory || email.aiCategory || 'UNKNOWN';

  const x = useMotionValue(0);
  const [isPastRightThreshold, setIsPastRightThreshold] = useState(false);
  const [isPastLeftThreshold, setIsPastLeftThreshold] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      setIsPastRightThreshold(latest >= SWIPE_THRESHOLD);
      setIsPastLeftThreshold(latest <= -SWIPE_THRESHOLD);
    });
    return () => unsubscribe();
  }, [x]);

  // Gmail-style transforms behind the card
  const archiveOpacity = useTransform(x, [0, 15, SWIPE_THRESHOLD], [0, 0.45, 1]);
  const archiveScale = useTransform(x, [15, SWIPE_THRESHOLD, SWIPE_THRESHOLD + 40], [0.8, 1, 1.15]);

  const trashOpacity = useTransform(x, [-SWIPE_THRESHOLD, -15, 0], [1, 0.45, 0]);
  const trashScale = useTransform(x, [-(SWIPE_THRESHOLD + 40), -SWIPE_THRESHOLD, -15], [1.15, 1, 0.8]);

  const handleDragEnd = async () => {
    const currentX = x.get();
    if (currentX >= SWIPE_THRESHOLD) {
      await animate(x, 500, { duration: 0.2, ease: 'easeOut' });
      actions.archive(email.id);
    } else if (currentX <= -SWIPE_THRESHOLD) {
      await animate(x, -500, { duration: 0.2, ease: 'easeOut' });
      actions.trash(email.id);
    } else {
      await animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  const handleCardClick = () => {
    if (isDraggingRef.current || Math.abs(x.get()) > 5) return;
    setModalOpen(true);
  };

  return (
    <>
      <motion.article
        aria-label={email.subject}
        layout
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2, layout: { duration: 0.15 } }}
        className="relative overflow-hidden rounded-card"
      >
        {/* Background Swipe Tray */}
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-between overflow-hidden rounded-card">
          {/* Left: Archive */}
          <motion.div
            style={{ opacity: archiveOpacity }}
            className={twMerge(
              'flex h-full w-full items-center justify-start gap-xs pl-md transition-colors duration-150',
              isPastRightThreshold ? 'bg-status-success text-white' : 'bg-status-success-subtle text-status-success'
            )}
          >
            <motion.div style={{ scale: archiveScale }} className="flex items-center gap-xs font-semibold">
              <FaArchive className="text-base" />
              <span className="text-xs font-bold tracking-wider uppercase">Archive</span>
            </motion.div>
          </motion.div>

          {/* Right: Delete */}
          <motion.div
            style={{ opacity: trashOpacity }}
            className={twMerge(
              'flex h-full w-full items-center justify-end gap-xs pr-md transition-colors duration-150',
              isPastLeftThreshold ? 'bg-status-danger text-white' : 'bg-status-danger-subtle text-status-danger'
            )}
          >
            <motion.div style={{ scale: trashScale }} className="flex items-center gap-xs font-semibold">
              <span className="text-xs font-bold tracking-wider uppercase">Delete</span>
              <FaTrash className="text-base" />
            </motion.div>
          </motion.div>
        </div>

        {/* Foreground Draggable Card */}
        <motion.div
          style={{ x }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.65, right: 0.65 }}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={handleDragEnd}
          onClick={handleCardClick}
          className="email-card relative z-10 touch-pan-y cursor-grab active:cursor-grabbing select-none"
        >
          {/* Card Body */}
          <div className="flex flex-1 flex-col">
            <header className="email-card-header">
              <span className="email-card-sender" title={email.sender}>
                {email.sender}
              </span>
              <time dateTime={email.date}>
                {new Date(email.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </header>

            <h2 className="mt-xs line-clamp-2" title={email.subject}>
              {email.subject}
            </h2>

            {email.snippet && <p className="email-card-snippet">{email.snippet}</p>}
          </div>

          {/* Card Footer */}
          <footer className="email-card-footer">
            <div className="flex items-center gap-xs">
              <Badge variant="primary">{formatCategory(categoryKey)}</Badge>
              {email.important && (
                <span className="flex items-center text-status-warning" title="Important email">
                  <FaStar className="text-xs" />
                </span>
              )}
            </div>

            {/* Desktop Action Toolbar */}
            <div
              role="toolbar"
              aria-label="Email Actions"
              className="hidden sm:flex"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => actions.markImportant(email.id, !email.important)}
                title={email.important ? 'Remove star' : 'Star as important'}
                aria-label={email.important ? 'Remove star' : 'Star as important'}
                className={twMerge(
                  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-control transition-colors',
                  email.important
                    ? 'bg-status-warning-subtle text-status-warning'
                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'
                )}
              >
                <FaStar className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => actions.categorize(email.id, 'UNKNOWN')}
                title="Mark category as unknown"
                aria-label="Mark category as unknown"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary"
              >
                <FaQuestion className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => actions.archive(email.id)}
                title="Archive email"
                aria-label="Archive email"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-status-success transition-colors hover:bg-status-success-subtle hover:text-status-success active:opacity-80"
              >
                <FaArchive className="text-xs" />
              </button>

              <button
                type="button"
                onClick={() => actions.trash(email.id)}
                title="Move email to trash"
                aria-label="Move email to trash"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-status-danger transition-colors hover:bg-status-danger-subtle hover:text-status-danger active:opacity-80"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          </footer>
        </motion.div>
      </motion.article>

      {modalOpen && (
        <EmailModal
          email={email}
          actions={actions}
          categories={categories}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
