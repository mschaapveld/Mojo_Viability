import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type VButtonVariant = 'solid' | 'ghost';
type VButtonSize = 'sm' | 'md' | 'lg';

interface VButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VButtonVariant;
  size?: VButtonSize;
  asChild?: boolean;
}

const sizeClasses: Record<VButtonSize, string> = {
  sm: 'text-[13px] py-[9px] px-4',
  md: 'text-[14.5px] py-[13px] px-[22px]',
  lg: 'text-[15.5px] py-4 px-7',
};

const variantClasses: Record<VButtonVariant, string> = {
  solid: cn(
    'bg-viability-green text-viability-green-on font-semibold',
    'shadow-[0_4px_14px_rgba(52,211,153,0.18)]',
    'hover:bg-viability-green-hover hover:-translate-y-[1px]',
    'hover:shadow-[0_6px_24px_rgba(52,211,153,0.30)]',
  ),
  ghost: cn(
    'bg-transparent text-viability-cream',
    'border border-viability-border-strong',
    'hover:bg-[rgba(245,242,237,0.06)]',
  ),
};

export const VButton = forwardRef<HTMLButtonElement, VButtonProps>(
  ({ className, variant = 'solid', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer',
          'font-sans font-medium rounded-pill',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viability-green-line',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
VButton.displayName = 'VButton';
