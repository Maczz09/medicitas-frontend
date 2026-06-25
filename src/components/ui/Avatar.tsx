import { iniciales } from '@/lib/format';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/** Avatar de iniciales con color derivado del nombre. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const palette = [
    'from-brand-500 to-brand-700',
    'from-sky-500 to-blue-700',
    'from-indigo-500 to-blue-800',
    'from-cyan-500 to-blue-700',
    'from-violet-500 to-indigo-700',
  ];
  const idx = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/10',
        palette[idx],
        sizes[size],
        className,
      )}
    >
      {iniciales(name)}
    </div>
  );
}
