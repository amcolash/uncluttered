import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

import { Badge } from './Badge';

export interface PageHeaderProps {
  title: string;
  count?: number | string;
  badge?: {
    label: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  };
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  count,
  badge,
  description,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={twMerge('page-header', className)}>
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          <div className="flex flex-wrap items-center gap-xs sm:gap-sm">
            <h1>
              {title}
              {count !== undefined && <span className="ml-xs text-text-muted">({count})</span>}
            </h1>
            {badge && (
              <Badge variant={badge.variant ?? 'primary'}>
                {badge.label}
              </Badge>
            )}
          </div>
          {description && <div className="text-xs text-text-secondary sm:text-sm">{description}</div>}
        </div>

        {actions && (
          <div role="toolbar" aria-label="Page Actions" className="flex flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children}
    </header>
  );
}
