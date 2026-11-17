import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'subtle' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  variant?: CardVariant;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-sm',
  md: 'p-md',
  lg: 'p-lg',
};

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-border-default bg-surface-card shadow-card',
  subtle: 'border border-border-subtle bg-surface-subtle shadow-card',
  interactive:
    'border border-border-default bg-surface-card shadow-card transition-all duration-150 hover:border-border-strong hover:bg-surface-card-hover hover:shadow-elevated cursor-pointer',
};

export function Card({ padding = 'md', variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div className={twMerge('rounded-card', variantClasses[variant], paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header className={twMerge('gap-xs flex flex-col', className)} {...props}>
      {children}
    </header>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={twMerge('text-text-primary text-base font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge('text-text-secondary text-sm', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge('mt-md', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={twMerge('mt-md gap-sm border-border-subtle pt-md flex items-center border-t', className)}
      {...props}
    >
      {children}
    </footer>
  );
}
