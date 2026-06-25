import type { Role } from '@/types';

/** Ruta de inicio (dashboard) según el rol del usuario. */
export const ROLE_HOME: Record<Role, string> = {
  Recepcionista: '/recepcion',
  Médico: '/medico',
  Auditor: '/auditor',
};

export function homePathForRole(rol?: Role | null): string {
  if (!rol) return '/login';
  return ROLE_HOME[rol] ?? '/login';
}

/** Etiqueta corta y color asociado a cada rol (para chips/avatares). */
export const ROLE_META: Record<Role, { label: string; color: string }> = {
  Recepcionista: { label: 'Recepción', color: 'text-brand-300' },
  Médico: { label: 'Médico', color: 'text-ok' },
  Auditor: { label: 'Auditoría', color: 'text-warn' },
};
