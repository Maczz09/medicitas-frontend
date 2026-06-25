import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  hint?: string;
  index?: number;
}

const toneStyles = {
  brand: 'text-brand-300 bg-brand-500/12',
  success: 'text-emerald-300 bg-ok/12',
  warning: 'text-amber-300 bg-warn/12',
  danger: 'text-rose-300 bg-bad/12',
  info: 'text-sky-300 bg-sky2/12',
};

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
      className="glass group relative overflow-hidden rounded-2xl p-5 shadow-card"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/5 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink-100">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
