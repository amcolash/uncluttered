import type { InputHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Input({ label, error, hint, startIcon, endIcon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="gap-xs flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-text-secondary text-xs font-medium sm:text-sm">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && <span className="text-text-muted pointer-events-none absolute left-3">{startIcon}</span>}
        <input
          id={inputId}
          className={twMerge(
            'rounded-control bg-surface-input px-sm text-text-primary h-9 w-full border text-sm',
            'placeholder:text-text-muted',
            'transition-colors duration-150',
            'focus:ring-offset-surface-canvas focus:ring-2 focus:ring-offset-1 focus:outline-none',
            error
              ? 'border-status-danger focus:ring-status-danger'
              : 'border-border-default focus:ring-border-focus enabled:hover:border-border-strong focus:border-transparent',
            !!startIcon && 'pl-9',
            !!endIcon && 'pr-9',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {endIcon && <span className="text-text-muted pointer-events-none absolute right-3">{endIcon}</span>}
      </div>
      {error && <p className="text-status-danger text-xs">{error}</p>}
      {!error && hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  );
}
