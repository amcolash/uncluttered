import { twMerge } from 'tailwind-merge';

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';
type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

const variantClasses: Record<ProgressVariant, string> = {
  default: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  animated = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={twMerge('flex flex-col gap-1.5', className)}>
      {(label ?? showValue) && (
        <div className="flex items-center justify-between gap-4">
          {label && <span className="text-sm text-slate-300">{label}</span>}
          {showValue && <span className="ml-auto text-xs text-slate-400 tabular-nums">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={twMerge('w-full overflow-hidden rounded-full bg-slate-700', sizeClasses[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={twMerge(
            'h-full rounded-full transition-[width] duration-300 ease-out',
            variantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
