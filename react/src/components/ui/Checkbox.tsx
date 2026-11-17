import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export function Checkbox({ label, description, error, className, id, ...props }: CheckboxProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="gap-xs flex flex-col">
      <label
        htmlFor={inputId}
        className={twMerge(
          'group gap-sm rounded-control px-xs py-2xs flex cursor-pointer items-start',
          'transition-colors duration-150',
          !props.disabled && 'hover:bg-surface-card',
          props.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input type="checkbox" id={inputId} className="sr-only" {...props} />
        {/* Custom checkbox box */}
        <span
          className={twMerge(
            'mt-px flex size-4 shrink-0 items-center justify-center rounded border',
            'transition-all duration-150',
            'border-border-default',
            !props.disabled && 'group-hover:border-border-strong',
            'group-has-[:checked]:border-brand-primary group-has-[:checked]:bg-brand-primary',
            'group-has-[:focus-visible]:ring-border-focus group-has-[:focus-visible]:ring-offset-surface-canvas group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-offset-2',
            className
          )}
        >
          {/* Checkmark */}
          <svg
            className={twMerge(
              'text-text-primary size-2.5',
              'opacity-0 transition-opacity duration-150 group-has-[:checked]:opacity-100'
            )}
            viewBox="0 0 12 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="1 5 4 8 11 1" />
          </svg>
        </span>
        {(label ?? description) && (
          <div className="gap-2xs flex flex-col">
            {label && <span className="text-text-primary text-xs font-medium sm:text-sm">{label}</span>}
            {description && <span className="text-text-muted text-xs">{description}</span>}
          </div>
        )}
      </label>
      {error && <p className="text-status-danger text-xs">{error}</p>}
    </div>
  );
}
