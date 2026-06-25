import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileHeart,
  LayoutDashboard,
  type LucideIcon,
  Pill,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  Recepcionista: [
    { label: 'Inicio', to: '/recepcion', icon: LayoutDashboard, end: true },
    { label: 'Pacientes', to: '/recepcion/pacientes', icon: Users },
    { label: 'Citas', to: '/recepcion/citas', icon: CalendarDays },
    { label: 'Cobertura', to: '/recepcion/cobertura', icon: ShieldCheck },
    { label: 'Pagos', to: '/recepcion/pagos', icon: CreditCard },
    { label: 'Recetas', to: '/recepcion/recetas', icon: Pill },
  ],
  Médico: [
    { label: 'Inicio', to: '/medico', icon: LayoutDashboard, end: true },
    { label: 'Atención', to: '/medico/atencion', icon: Stethoscope },
    { label: 'Historia clínica', to: '/medico/historias', icon: FileHeart },
    { label: 'Mi agenda', to: '/medico/agenda', icon: CalendarClock },
    { label: 'Recetas', to: '/medico/recetas', icon: Pill },
  ],
  Auditor: [
    { label: 'Inicio', to: '/auditor', icon: LayoutDashboard, end: true },
    { label: 'Trazas', to: '/auditor/trazas', icon: ScrollText },
    { label: 'Usuarios', to: '/auditor/usuarios', icon: UserCog },
    { label: 'Médicos', to: '/auditor/medicos', icon: Stethoscope },
  ],
};
