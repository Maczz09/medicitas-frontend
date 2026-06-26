import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-glow-sm hover:brightness-110 active:brightness-95',
  secondary: 'border border-white/10 bg-white/[0.05] text-ink-100 hover:bg-white/10',
  ghost: 'text-ink-200 hover:bg-white/[0.06] hover:text-ink-100',
  danger: 'bg-bad/90 text-white hover:bg-bad active:brightness-95',
  outline: 'border border-brand-500/40 text-brand-200 hover:bg-brand-500/10',
  success: 'bg-ok/90 text-white hover:bg-ok active:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
  icon: 'h-10 w-10 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
