import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Eye, EyeOff, Lock, LogIn, Mail, ShieldOff, UserX } from 'lucide-react';
import axios from 'axios';
import { AuthShell } from './AuthShell';
import { Button, Input } from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';
import type { ApiErrorBody } from '@/types';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type FormValues = z.infer<typeof schema>;

type AuthErrorState = {
  code: string;
  message: string;
  remaining?: number;
  unlockAt?: string;
};

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const [showPass, setShowPass] = useState(false);
  const [authErr, setAuthErr] = useState<AuthErrorState | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuthErr(null);
      setSession(data);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathForRole(data.rol), { replace: true });
    },
    onError: (err) => {
      if (!axios.isAxiosError(err)) {
        setAuthErr({ code: 'UNKNOWN', message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
        return;
      }

      const body = err.response?.data as ApiErrorBody | undefined;
      const code = body?.codigo ?? 'UNKNOWN';
      const message = body?.mensaje ?? 'No se pudo iniciar sesión';
      const meta = body?.meta;

      if (code === 'USER_NOT_FOUND') {
        setError('email', { message: 'No existe ninguna cuenta con ese correo' });
        setAuthErr(null);
        return;
      }

      if (code === 'WRONG_PASSWORD') {
        setError('password', { message: message });
        setAuthErr({ code, message, remaining: meta?.remaining as number | undefined });
        return;
      }

      if (code === 'ACCOUNT_LOCKED') {
        setAuthErr({ code, message, unlockAt: meta?.unlockAt as string | undefined });
        return;
      }

      setAuthErr({ code, message });
    },
  });

  const onSubmit = (v: FormValues) => {
    clearErrors();
    setAuthErr(null);
    mutation.mutate(v);
  };

  const isLocked = authErr?.code === 'ACCOUNT_LOCKED';
  const isWrong  = authErr?.code === 'WRONG_PASSWORD';

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="font-display text-lg font-extrabold text-ink-100">MediCitas</span>
        </div>

        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-100">
          Iniciar sesión
        </h2>
        <p className="mt-1.5 text-sm text-ink-400">
          Accede con tu cuenta para gestionar la clínica.
        </p>

        {/* ── Lockout banner ── */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"
            >
              <div className="flex items-start gap-3">
                <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <p className="text-sm font-semibold text-rose-300">Esta cuenta está bloqueada</p>
                  <p className="mt-0.5 text-xs text-rose-400/80">
                    Demasiados intentos fallidos. Se habilitará a las{' '}
                    <span className="font-semibold text-rose-300">
                      {authErr?.unlockAt ? fmtHora(authErr.unlockAt) : '—'}
                    </span>
                    . Puedes iniciar sesión con otra cuenta.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wrong password warning (close to lockout) ── */}
        <AnimatePresence>
          {isWrong && typeof authErr?.remaining === 'number' && authErr.remaining <= 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">
                  Si fallas una vez más tu cuenta se bloqueará por 15 minutos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Generic error banner ── */}
        <AnimatePresence>
          {authErr && !isLocked && !isWrong && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 p-3"
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 shrink-0 text-rose-400" />
                <p className="text-sm text-rose-300">{authErr.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@medicitas.pe"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-[34px] text-ink-400 transition-colors hover:text-ink-200"
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={mutation.isPending}
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            Entrar
          </Button>
        </form>
      </motion.div>
    </AuthShell>
  );
}
