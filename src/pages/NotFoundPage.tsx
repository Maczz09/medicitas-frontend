import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  const home = user ? homePathForRole(user.rol) : '/login';

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex max-w-md flex-col items-center gap-4 rounded-3xl p-10 text-center shadow-card"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15">
          <Compass className="h-7 w-7 text-brand-300" />
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold text-ink-100">404</p>
          <p className="mt-1 text-sm text-ink-400">No encontramos la página que buscas.</p>
        </div>
        <Link to={home}>
          <Button>Volver al inicio</Button>
        </Link>
      </motion.div>
    </div>
  );
}
