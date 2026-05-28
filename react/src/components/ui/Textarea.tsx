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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={twMerge(
          'w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white',
          'placeholder:text-slate-500',
          'resize-y transition-colors duration-150',
          'focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 focus:outline-none',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-slate-600 enabled:hover:border-slate-500 focus:border-transparent focus:ring-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
