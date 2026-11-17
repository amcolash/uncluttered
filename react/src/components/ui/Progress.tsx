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
  default: 'bg-brand-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
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
    <div className={twMerge('gap-xs flex flex-col', className)}>
      {(label ?? showValue) && (
        <div className="gap-sm flex items-center justify-between">
          {label && <span className="text-text-primary text-xs font-medium sm:text-sm">{label}</span>}
          {showValue && <span className="text-text-muted ml-auto text-xs tabular-nums">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={twMerge('bg-surface-elevated w-full overflow-hidden rounded-full', sizeClasses[size])}
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
