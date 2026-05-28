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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && <span className="pointer-events-none absolute left-3 text-slate-400">{startIcon}</span>}
        <input
          id={inputId}
          className={twMerge(
            'h-9 w-full rounded-lg border bg-slate-800 px-3 text-sm text-white',
            'placeholder:text-slate-500',
            'transition-colors duration-150',
            'focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:outline-none',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-600 enabled:hover:border-slate-500 focus:border-transparent focus:ring-indigo-500',
            !!startIcon && 'pl-9',
            !!endIcon && 'pr-9',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {endIcon && <span className="pointer-events-none absolute right-3 text-slate-400">{endIcon}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
