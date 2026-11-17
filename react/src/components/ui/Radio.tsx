import { twMerge } from 'tailwind-merge';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  orientation = 'vertical',
}: RadioGroupProps) {
  return (
    <fieldset className="gap-xs flex flex-col">
      {label && <legend className="mb-2xs text-text-secondary text-xs font-medium sm:text-sm">{label}</legend>}
      <div className={twMerge('gap-xs flex', orientation === 'vertical' ? 'flex-col' : 'gap-sm flex-row flex-wrap')}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={twMerge(
              'group gap-sm rounded-control px-xs py-2xs flex cursor-pointer items-start',
              'transition-colors duration-150',
              !opt.disabled && 'hover:bg-surface-card',
              opt.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => !opt.disabled && onChange?.(opt.value)}
              disabled={opt.disabled}
              className="sr-only"
            />
            {/* Custom radio ring */}
            <span
              className={twMerge(
                'mt-px flex size-4 shrink-0 items-center justify-center rounded-full border',
                'transition-all duration-150',
                'border-border-default',
                !opt.disabled && 'group-hover:border-border-strong',
                'group-has-[:checked]:border-brand-primary',
                'group-has-[:focus-visible]:ring-border-focus group-has-[:focus-visible]:ring-offset-surface-canvas group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-offset-2'
              )}
            >
              <span
                className={twMerge(
                  'bg-brand-primary size-1.5 rounded-full',
                  'scale-0 transition-transform duration-150 group-has-[:checked]:scale-100'
                )}
              />
            </span>
            <div className="gap-2xs flex flex-col">
              <span className="text-text-primary text-xs font-medium sm:text-sm">{opt.label}</span>
              {opt.description && <span className="text-text-muted text-xs">{opt.description}</span>}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-2xs text-status-danger text-xs">{error}</p>}
    </fieldset>
  );
}
