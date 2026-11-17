import type { TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="gap-xs flex flex-col">
      {label && (
        <label htmlFor={textareaId} className="text-text-secondary text-xs font-medium sm:text-sm">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={twMerge(
          'rounded-control bg-surface-input px-sm py-xs text-text-primary w-full border text-sm',
          'placeholder:text-text-muted',
          'resize-y transition-colors duration-150',
          'focus:ring-offset-surface-canvas focus:ring-2 focus:ring-offset-1 focus:outline-none',
          error
            ? 'border-status-danger focus:ring-status-danger'
            : 'border-border-default focus:ring-border-focus enabled:hover:border-border-strong focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {error && <p className="text-status-danger text-xs">{error}</p>}
      {!error && hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  );
}
