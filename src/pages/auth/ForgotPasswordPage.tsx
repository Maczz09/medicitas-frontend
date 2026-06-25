import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from './AuthShell';
import { Button, Input } from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { apiError } from '@/api/http';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Te enviamos un código a tu correo');
      navigate('/reset-password', { state: { email: getValues('email') } });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo enviar el código')),
  });

  return (
    <AuthShell>
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15">
          <KeyRound className="h-5 w-5 text-brand-300" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink-100">
          Recuperar acceso
        </h2>
        <p className="mt-1.5 text-sm text-ink-400">
          Ingresa tu correo y te enviaremos un código de un solo uso (OTP).
        </p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v.email))} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@medicitas.pe"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Enviar código
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
