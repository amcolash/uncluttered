import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = '🎉', title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={twMerge(
        'gap-sm rounded-card border-border-default bg-surface-card p-xl shadow-card sm:p-2xl flex flex-col items-center justify-center border text-center',
        className
      )}
    >
      {typeof icon === 'string' ? <span className="text-4xl select-none sm:text-5xl">{icon}</span> : icon}
      <h3 className="text-text-primary text-base font-bold tracking-tight sm:text-lg">{title}</h3>
      {description && (
        <div className="text-text-secondary max-w-md text-xs leading-relaxed sm:text-sm">{description}</div>
      )}
      {action && <div className="mt-xs gap-xs flex items-center">{action}</div>}
    </div>
  );
}
