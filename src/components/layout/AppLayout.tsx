import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SidebarContent } from './Sidebar';
import { Topbar } from './Topbar';
import { PageShell } from './PageShell';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';
import { Navigate } from 'react-router-dom';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useCloseWindowLogout } from '@/hooks/useCloseWindowLogout';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { ResilienceBanner } from '@/components/domain/ResilienceBanner';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  useInactivityTimeout();
  useCloseWindowLogout();
  // Solo aquí, no en App.tsx: el ticket de /realtime requiere sesión — antes
  // de esto, el hook se montaba también en /login y peleaba en un loop de
  // reintentos contra 401 sin sentido, ya que el usuario aún no tiene token.
  useRealtimeSync();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar de escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/[0.06] bg-navy-900/40 lg:flex">
        <SidebarContent rol={user.rol} idPrefix="desktop" />
      </aside>

      {/* Drawer móvil */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              className="fixed inset-0 z-40 cursor-pointer bg-navy-950/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.06] bg-navy-900 lg:hidden"
            >
              <button
                onClick={() => setMobileNav(false)}
                className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-ink-400 hover:bg-white/[0.06]"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent rol={user.rol} idPrefix="mobile" onNavigate={() => setMobileNav(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ResilienceBanner />
        <Topbar onMenu={() => setMobileNav(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <PageShell key={location.pathname}>
              <Outlet />
            </PageShell>
          </div>
        </main>
      </div>
    </div>
  );
}

export { homePathForRole };
