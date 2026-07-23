import {
  Activity,
  Bell,
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
    { label: 'Usuarios', to: '/recepcion/usuarios', icon: UserCog },
  ],
  Médico: [
    { label: 'Inicio', to: '/medico', icon: LayoutDashboard, end: true },
    { label: 'Atención', to: '/medico/atencion', icon: Stethoscope },
    { label: 'Historia clínica', to: '/medico/historias', icon: FileHeart },
    { label: 'Mi agenda', to: '/medico/agenda', icon: CalendarClock },
    { label: 'Recetas', to: '/medico/recetas', icon: Pill },
    { label: 'Usuarios', to: '/medico/usuarios', icon: UserCog },
  ],
  Auditor: [
    { label: 'Inicio', to: '/auditor', icon: LayoutDashboard, end: true },
    { label: 'Pacientes', to: '/auditor/pacientes', icon: Users },
    { label: 'Citas', to: '/auditor/citas', icon: CalendarDays },
    { label: 'Cobertura', to: '/auditor/cobertura', icon: ShieldCheck },
    { label: 'Pagos', to: '/auditor/pagos', icon: CreditCard },
    { label: 'Prescripciones', to: '/auditor/prescripciones', icon: Pill },
    { label: 'Médicos', to: '/auditor/medicos', icon: Stethoscope },
    { label: 'Horarios médicos', to: '/auditor/medicos/horarios', icon: CalendarClock },
    { label: 'Usuarios', to: '/auditor/usuarios', icon: UserCog },
    { label: 'Notificaciones', to: '/auditor/notificaciones', icon: Bell },
    { label: 'Eventos Auditados (Trazas)', to: '/auditor/trazas', icon: ScrollText },
    { label: 'Monitoreo de Sistema', to: '/auditor/monitoreo', icon: Activity },
  ],
};
