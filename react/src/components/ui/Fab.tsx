import { AnimatePresence, motion } from 'motion/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  openIcon?: ReactNode;
  isOpen?: boolean;
}

export function Fab({ icon, openIcon, isOpen, className, ...props }: FabProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={twMerge(
        'fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50',
        'border-brand-primary/40 bg-brand-primary text-text-primary shadow-elevated flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border',
        'hover:bg-brand-hover active:opacity-90',
        'focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...(props as any)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? 'open' : 'closed'}
          initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isOpen && openIcon ? openIcon : icon}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
