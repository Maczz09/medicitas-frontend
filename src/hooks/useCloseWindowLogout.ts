import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

const STORAGE_KEY = 'medicitas-window-closed-at';
const CLOSE_LOGOUT_MS = 5000;

// Un navegador no permite ejecutar un timer DESPUÉS de que la pestaña ya se
// cerró, así que no existe un "cerrar sesión 5s tras cerrar ventana" literal.
// Se aproxima guardando el instante de cierre (pagehide) y, al volver a
// abrir/enfocar la app, cerrando la sesión si pasaron más de 5s desde
// entonces — un F5 o una navegación normal no alcanza ese umbral.
export function useCloseWindowLogout() {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const closedAt = localStorage.getItem(STORAGE_KEY);
    if (closedAt) {
      localStorage.removeItem(STORAGE_KEY);
      if (Date.now() - Number(closedAt) > CLOSE_LOGOUT_MS) {
        logout();
        window.location.assign('/login');
        return;
      }
    }

    function marcarCierre() {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    window.addEventListener('pagehide', marcarCierre);
    return () => window.removeEventListener('pagehide', marcarCierre);
  }, [isAuthenticated, logout]);
}
