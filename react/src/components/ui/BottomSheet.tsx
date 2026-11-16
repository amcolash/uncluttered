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

          {/* Slide-up bottom sheet card with drag-to-dismiss */}
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
              'fixed inset-x-0 bottom-0 z-40 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl',
              className
            )}
          >
            {/* Drag handle */}
            <div className="flex w-full cursor-grab justify-center pt-2.5 pb-1 active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-slate-700 transition-colors hover:bg-slate-600" />
            </div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {headerActions}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
