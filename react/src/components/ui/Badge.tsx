import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-700 text-slate-300',
  primary: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30',
  danger: 'bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30',
  outline: 'bg-transparent text-slate-300 ring-1 ring-inset ring-slate-600',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
