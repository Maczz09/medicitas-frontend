import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';
import type { Role } from '@/types';

/** Restringe un grupo de rutas a roles específicos. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.rol)) {
    return <Navigate to={homePathForRole(user.rol)} replace />;
  }
  return <Outlet />;
}
