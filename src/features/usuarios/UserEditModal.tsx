import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Select } from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { apiError } from '@/api/http';
import type { Role, UsuarioAdmin } from '@/types';

const ROLES: Role[] = ['Recepcionista', 'Médico', 'Auditor'];

interface Props {
  usuario: UsuarioAdmin | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canEditRole: boolean;
}

interface FormValues {
  nombre: string;
  apellido: string;
  email: string;
  rolNombre: Role;
  activo: boolean;
}

export function UserEditModal({ usuario, open, onOpenChange, canEditRole }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>({
    values: {
      nombre: usuario?.nombre ?? '',
      apellido: usuario?.apellido ?? '',
      email: usuario?.email ?? '',
      rolNombre: usuario?.rolNombre ?? 'Recepcionista',
      activo: usuario ? usuario.activo === 1 || usuario.activo === true : true,
    },
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<FormValues>) => authApi.updateUsuario(usuario!.id_usuario, body),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar')),
  });

  const onSubmit = (v: FormValues) => {
    const body: Partial<FormValues> = {
      nombre: v.nombre,
      apellido: v.apellido,
      email: v.email,
      activo: v.activo,
    };
    if (canEditRole) body.rolNombre = v.rolNombre;
    mutation.mutate(body);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Editar usuario"
      description={usuario ? `${usuario.nombre} ${usuario.apellido}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={mutation.isPending}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
        <Input label="Nombre" {...register('nombre')} />
        <Input label="Apellido" {...register('apellido')} />
        <div className="col-span-2">
          <Input label="Correo" type="email" {...register('email')} />
        </div>
        {canEditRole && (
          <div className="col-span-2">
            <Select label="Rol" {...register('rolNombre')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        )}
        <label className="col-span-2 mt-1 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <input type="checkbox" {...register('activo')} className="h-4 w-4 accent-brand-500" />
          <span className="text-sm text-ink-200">Cuenta activa (puede iniciar sesión)</span>
        </label>
      </form>
    </Modal>
  );
}
