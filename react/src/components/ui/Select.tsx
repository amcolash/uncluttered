import type { SelectHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, hint, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="gap-xs flex flex-col">
      {label && (
        <label htmlFor={selectId} className="text-text-secondary text-xs font-medium sm:text-sm">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={twMerge(
            'rounded-control bg-surface-input pl-sm text-text-primary h-9 w-full appearance-none border pr-8 text-sm',
            'transition-colors duration-150',
            'focus:ring-offset-surface-canvas focus:ring-2 focus:ring-offset-1 focus:outline-none',
            error
              ? 'border-status-danger focus:ring-status-danger'
              : 'border-border-default focus:ring-border-focus enabled:hover:border-border-strong focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-card text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
      {error && <p className="text-status-danger text-xs">{error}</p>}
      {!error && hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  );
}
