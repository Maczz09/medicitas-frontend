import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-ink-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-xl border border-white/10 bg-navy-900/60 px-3.5 pr-9 text-sm text-ink-100 transition-colors',
              'focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
              '[&>option]:bg-navy-850 [&>option]:text-ink-100',
              error && 'border-bad/60',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
