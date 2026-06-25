import { cn } from '@/lib/cn';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-500/15 text-brand-200 ring-brand-500/25',
  success: 'bg-ok/15 text-emerald-300 ring-ok/25',
  warning: 'bg-warn/15 text-amber-300 ring-warn/25',
  danger: 'bg-bad/15 text-rose-300 ring-bad/25',
  neutral: 'bg-white/[0.06] text-ink-300 ring-white/10',
  info: 'bg-sky2/15 text-sky-300 ring-sky2/25',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
