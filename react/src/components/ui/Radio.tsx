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
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="mb-0.5 text-sm font-medium text-slate-300">{label}</legend>}
      <div className={twMerge('flex gap-1', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-2')}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={twMerge(
              'group flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5',
              'transition-colors duration-150',
              !opt.disabled && 'hover:bg-slate-800/60',
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
                'mt-px flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                'transition-all duration-150',
                'border-slate-600',
                !opt.disabled && 'group-hover:border-indigo-400',
                'group-has:checked:border-indigo-500',
                'group-has:focus-visible:ring-2 group-has:focus-visible:ring-indigo-500 group-has:focus-visible:ring-offset-2 group-has:focus-visible:ring-offset-slate-900'
              )}
            >
              <span
                className={twMerge(
                  'size-1.5 rounded-full bg-white',
                  'group-has:checked:scale-100 scale-0 transition-transform duration-150'
                )}
              />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm leading-none text-slate-200">{opt.label}</span>
              {opt.description && <span className="text-xs text-slate-500">{opt.description}</span>}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-0.5 text-xs text-red-400">{error}</p>}
    </fieldset>
  );
}
