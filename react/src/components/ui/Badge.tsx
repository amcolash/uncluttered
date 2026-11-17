import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-text-secondary border border-border-default',
  primary: 'bg-brand-subtle text-text-primary border border-brand-primary/40',
  success: 'bg-status-success-subtle text-status-success border border-status-success/40',
  warning: 'bg-status-warning-subtle text-status-warning border border-status-warning/40',
  danger: 'bg-status-danger-subtle text-status-danger border border-status-danger/40',
  outline: 'bg-transparent text-text-secondary border border-border-default',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        'px-sm py-2xs inline-flex items-center rounded-full text-xs font-medium transition-colors select-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
