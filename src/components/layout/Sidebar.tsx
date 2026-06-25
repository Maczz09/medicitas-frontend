import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_BY_ROLE, type NavItem } from '@/config/navigation';
import type { Role } from '@/types';

function NavRow({ item, idPrefix, onNavigate }: { item: NavItem; idPrefix: string; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate}>
      {({ isActive }) => (
        <div
          className={cn(
            'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
            isActive ? 'text-white' : 'text-ink-300 hover:bg-white/[0.04] hover:text-white',
          )}
        >
          {isActive && (
            <motion.div
              layoutId={`${idPrefix}-nav-active`}
              className="absolute inset-0 rounded-xl bg-brand-500/15 ring-1 ring-inset ring-brand-500/25"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <Icon className="relative h-[18px] w-[18px] shrink-0" />
          <span className="relative font-medium">{item.label}</span>
        </div>
      )}
    </NavLink>
  );
}

export function SidebarContent({
  rol,
  idPrefix,
  onNavigate,
}: {
  rol: Role;
  idPrefix: string;
  onNavigate?: () => void;
}) {
  const items = NAV_BY_ROLE[rol] ?? [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
          <Activity className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-extrabold tracking-tight text-ink-100">
            MediCitas
          </p>
          <p className="text-[11px] text-ink-500">Gestión clínica</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavRow key={item.to} item={item} idPrefix={idPrefix} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-5 py-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] font-medium text-ink-300">Sistema operativo</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-ok" />
            <span className="text-[11px] text-ink-500">Servicios en línea</span>
          </div>
        </div>
      </div>
    </div>
  );
}
