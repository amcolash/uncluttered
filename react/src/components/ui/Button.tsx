import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-text-primary not-disabled:hover:bg-brand-hover active:opacity-90 shadow-sm',
  secondary:
    'bg-surface-card text-text-secondary not-disabled:hover:bg-surface-card-hover not-disabled:hover:text-text-primary border border-border-default active:bg-surface-subtle',
  ghost:
    'bg-transparent text-text-secondary not-disabled:hover:bg-surface-card-hover not-disabled:hover:text-text-primary active:bg-surface-card',
  danger: 'bg-status-danger text-text-primary not-disabled:hover:opacity-90 active:opacity-80 shadow-sm',
  warning:
    'bg-status-warning text-surface-canvas font-semibold not-disabled:hover:opacity-90 active:opacity-80 shadow-sm',
  success: 'bg-status-success text-text-primary not-disabled:hover:opacity-90 active:opacity-80 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-sm text-xs gap-xs',
  md: 'h-9 px-md text-sm gap-sm',
  lg: 'h-11 px-lg text-base gap-sm',
};

export function getButtonStyle({
  variant = 'primary',
  size = 'md',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}): string {
  return twMerge(
    'inline-flex cursor-pointer items-center justify-center rounded-control font-medium',
    'transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50 select-none',
    variantClasses[variant],
    sizeClasses[size]
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={twMerge(getButtonStyle({ variant, size }), className)} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
