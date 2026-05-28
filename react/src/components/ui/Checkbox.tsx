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
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={twMerge(
          'group flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5',
          'transition-colors duration-150',
          !props.disabled && 'hover:bg-slate-800/60',
          props.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input type="checkbox" id={inputId} className="sr-only" {...props} />
        {/* Custom checkbox box */}
        <span
          className={twMerge(
            'mt-px flex size-4 shrink-0 items-center justify-center rounded border-2',
            'transition-all duration-150',
            'border-slate-600',
            !props.disabled && 'group-hover:border-indigo-400',
            'group-has-[:checked]:border-indigo-500 group-has-[:checked]:bg-indigo-500',
            'group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-indigo-500 group-has-[:focus-visible]:ring-offset-2 group-has-[:focus-visible]:ring-offset-slate-900',
            className
          )}
        >
          {/* Checkmark */}
          <svg
            className={twMerge(
              'size-2.5 text-white',
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
          <div className="flex flex-col gap-0.5">
            {label && <span className="text-sm leading-none text-slate-200">{label}</span>}
            {description && <span className="text-xs text-slate-500">{description}</span>}
          </div>
        )}
      </label>
      {error && <p className="ml-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
