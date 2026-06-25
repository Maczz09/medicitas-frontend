import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from './AuthShell';
import { Button, Input } from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { apiError } from '@/api/http';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      toast.success('Bienvenido de nuevo');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathForRole(data.rol), { replace: true });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo iniciar sesión')),
  });

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

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mt-7 space-y-4">
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
