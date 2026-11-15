import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:brightness-110',
        outline: 'border border-line bg-surface hover:bg-line/40',
        ghost: 'hover:bg-line/50',
        danger: 'bg-rojo text-white hover:brightness-110',
      },
      size: { md: 'h-10 px-4', sm: 'h-8 px-3', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>>(
  ({ className, variant, size, ...p }, ref) => <button ref={ref} className={cn(button({ variant, size }), className)} {...p} />,
);
