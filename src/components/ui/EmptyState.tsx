import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <Icon className="h-6 w-6 text-ink-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-200">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-xs text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
