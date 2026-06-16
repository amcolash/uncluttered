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
  primary: 'bg-indigo-600 text-white not-disabled:hover:bg-indigo-500 not-disabled:active:bg-indigo-700',
  secondary:
    'bg-slate-700 text-slate-100 not-disabled:hover:bg-slate-600 not-disabled:active:bg-slate-800 border border-slate-600',
  ghost:
    'bg-transparent text-slate-300 not-disabled:hover:bg-slate-700 not-disabled:hover:text-white not-disabled:active:bg-slate-800',
  danger: 'bg-red-600 text-white not-disabled:hover:bg-red-500 not-disabled:active:bg-red-700',
  warning: 'bg-amber-500 text-slate-800 not-disabled:hover:bg-amber-400 not-disabled:active:bg-amber-600',
  success: 'bg-green-600 text-white not-disabled:hover:bg-green-500 not-disabled:active:bg-green-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
};

export function getButtonStyle({
  variant = 'primary',
  size = 'md',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}): string {
  return twMerge(
    'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium',
    'transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
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
