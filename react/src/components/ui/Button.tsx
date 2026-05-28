import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white enabled:hover:bg-indigo-500 enabled:active:bg-indigo-700',
  secondary: 'bg-slate-700 text-slate-100 enabled:hover:bg-slate-600 enabled:active:bg-slate-800 border border-slate-600',
  ghost: 'bg-transparent text-slate-300 enabled:hover:bg-slate-700 enabled:hover:text-white enabled:active:bg-slate-800',
  danger: 'bg-red-600 text-white enabled:hover:bg-red-500 enabled:active:bg-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
};

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
    <button
      disabled={disabled || loading}
      className={twMerge(
        'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
