import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, headerActions, children, className }: BottomSheetProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-up bottom sheet dialog with drag-to-dismiss */}
          <motion.div
            key="sheet-content"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.14, ease: 'easeIn' } }}
            transition={{
              type: 'spring',
              damping: 34,
              stiffness: 550,
              mass: 0.45,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 350) {
                onClose();
              }
            }}
            className={twMerge(
              'rounded-t-modal border-border-default bg-surface-subtle shadow-elevated fixed inset-x-0 bottom-0 z-40 flex max-h-[90dvh] flex-col border-t',
              className
            )}
          >
            {/* Drag handle */}
            <div className="pt-xs pb-2xs flex w-full cursor-grab justify-center active:cursor-grabbing">
              <div className="bg-border-default hover:bg-border-strong h-1.5 w-12 rounded-full transition-colors" />
            </div>

            {/* Header */}
            <header className="border-border-subtle px-md py-sm flex shrink-0 items-center justify-between border-b">
              <div className="gap-sm flex items-center">
                <h2 className="text-text-primary text-base font-semibold">{title}</h2>
                {headerActions}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-control p-xs text-text-muted hover:bg-surface-card hover:text-text-primary cursor-pointer transition-colors"
                aria-label="Close sheet"
              >
                <FaTimes className="text-base" />
              </button>
            </header>

            {/* Scrollable body */}
            <div className="space-y-md p-md flex-1 overflow-y-auto overscroll-contain pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
