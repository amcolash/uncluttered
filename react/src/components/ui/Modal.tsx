import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  full: 'max-w-5xl sm:h-[85vh]',
};

export function Modal({ isOpen, onClose, title, headerActions, children, className, size = 'lg' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="p-sm sm:p-md fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            key="modal-content"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 400,
            }}
            className={twMerge(
              'rounded-modal border-border-default bg-surface-card shadow-elevated relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || headerActions) && (
              <header className="border-border-subtle px-md py-sm sm:px-lg flex shrink-0 items-center justify-between border-b">
                <div className="gap-sm flex flex-1 items-center">
                  {typeof title === 'string' ? (
                    <h2 className="text-text-primary text-base font-semibold sm:text-lg">{title}</h2>
                  ) : (
                    title
                  )}
                </div>

                <div role="toolbar" aria-label="Modal actions" className="gap-xs flex items-center">
                  {headerActions}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-control p-xs text-text-muted hover:bg-surface-card-hover hover:text-text-primary cursor-pointer transition-colors"
                    aria-label="Close dialog"
                  >
                    <FaTimes className="text-base" />
                  </button>
                </div>
              </header>
            )}

            {/* Content Body */}
            <div className="p-md sm:p-lg flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
