import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// Party-specific badge
export interface PartyBadgeProps extends Omit<BadgeProps, 'variant'> {
  party: string;
}

const PartyBadge = forwardRef<HTMLSpanElement, PartyBadgeProps>(
  ({ className, party, ...props }, ref) => {
    const partyColors: Record<string, string> = {
      Democratic: 'bg-blue-100 text-blue-800',
      Democrat: 'bg-blue-100 text-blue-800',
      Republican: 'bg-red-100 text-red-800',
      Independent: 'bg-purple-100 text-purple-800',
      Libertarian: 'bg-yellow-100 text-yellow-800',
      Green: 'bg-green-100 text-green-800',
    };

    const colorClass = partyColors[party] || 'bg-gray-100 text-gray-800';

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full px-2 py-0.5 text-xs',
          colorClass,
          className
        )}
        {...props}
      >
        {party}
      </span>
    );
  }
);

PartyBadge.displayName = 'PartyBadge';

export { Badge, PartyBadge };
