import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Hash, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from './AuthShell';
import { Button, Input } from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { apiError } from '@/api/http';

// Mismos requisitos que el backend: 8+, mayúscula, minúscula, número y especial.
const passwordRule = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[a-z]/, 'Falta una minúscula')
  .regex(/[A-Z]/, 'Falta una mayúscula')
  .regex(/\d/, 'Falta un número')
  .regex(/[@$!%*?&]/, 'Falta un carácter especial (@$!%*?&)');

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  otpCode: z.string().length(6, 'El código tiene 6 dígitos'),
  newPassword: passwordRule,
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail },
  });

  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login', { replace: true });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo restablecer la contraseña')),
  });

  return (
    <AuthShell>
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ok/15">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink-100">
          Nueva contraseña
        </h2>
        <p className="mt-1.5 text-sm text-ink-400">
          Ingresa el código que recibiste y define tu nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Código OTP"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          leftIcon={<Hash className="h-4 w-4" />}
          error={errors.otpCode?.message}
          {...register('otpCode')}
        />
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.newPassword?.message}
          hint="8+ caracteres, mayúscula, minúscula, número y especial"
          {...register('newPassword')}
        />
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Restablecer contraseña
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-ink-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al inicio de sesión
      </Link>
    </AuthShell>
  );
}
