import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  SkeletonRows,
  Tooltip,
  type BadgeTone,
} from '@/components/ui';
import { authApi } from '@/api/auth.api';
import { apiError } from '@/api/http';
import { useDebounce } from '@/hooks/useDebounce';
import { fmtDate } from '@/lib/format';
import type { Role, UsuarioAdmin } from '@/types';

const ROLES: Role[] = ['Recepcionista', 'Médico', 'Auditor'];
const roleTone: Record<Role, BadgeTone> = {
  Recepcionista: 'brand',
  Médico: 'success',
  Auditor: 'warning',
};

const registerSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-z]/, 'Falta minúscula')
    .regex(/[A-Z]/, 'Falta mayúscula')
    .regex(/\d/, 'Falta número')
    .regex(/[@$!%*?&]/, 'Falta especial (@$!%*?&)'),
  rolNombre: z.enum(['Recepcionista', 'Médico', 'Auditor']),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function UsuariosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 350);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<UsuarioAdmin | null>(null);
  const [nuevoRol, setNuevoRol] = useState<Role>('Recepcionista');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['usuarios', debounced, page],
    queryFn: () => authApi.listUsuarios({ q: debounced || undefined, page, limit: 8 }),
    placeholderData: keepPreviousData,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { rolNombre: 'Recepcionista' } });

  const crear = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Usuario creado');
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      reset({ rolNombre: 'Recepcionista' });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo crear el usuario')),
  });

  const asignar = useMutation({
    mutationFn: () => authApi.assignRole(roleTarget!.id_usuario, nuevoRol),
    onSuccess: () => {
      toast.success('Rol actualizado');
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setRoleTarget(null);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo cambiar el rol')),
  });

  const usuarios = data?.data ?? [];
  const meta = data?.meta;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success('UUID copiado');
  };

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Todo el personal con acceso al sistema"
        actions={
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            Nuevo usuario
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] p-4">
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, correo o UUID…"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={6} /></div>
        ) : isError ? (
          <EmptyState icon={Users} title="No se pudieron cargar los usuarios" />
        ) : usuarios.length === 0 ? (
          <EmptyState icon={Users} title="Sin resultados" description={debounced ? 'Ningún usuario coincide.' : 'Aún no hay usuarios.'} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">UUID</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Médico vinculado</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="hidden px-5 py-3 font-medium md:table-cell">Registrado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => {
                    const activo = u.activo === 1 || u.activo === true;
                    return (
                      <motion.tr
                        key={u.id_usuario}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${u.nombre} ${u.apellido}`} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-100">{u.nombre} {u.apellido}</p>
                              <p className="truncate text-xs text-ink-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={roleTone[u.rolNombre] ?? 'neutral'}>{u.rolNombre}</Badge>
                        </td>
                        <td className="hidden px-5 py-3 lg:table-cell">
                          <button onClick={() => copy(u.id_usuario)} className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-400 transition-colors hover:text-brand-300">
                            {u.id_usuario.length > 14 ? u.id_usuario.slice(0, 14) + '…' : u.id_usuario}
                            <Copy className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="hidden px-5 py-3 xl:table-cell">
                          {u.id_medico ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-300">
                              <Stethoscope className="h-3.5 w-3.5" />
                              {u.id_medico.slice(0, 8)}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {activo ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="neutral" dot>Inactivo</Badge>}
                        </td>
                        <td className="hidden px-5 py-3 text-ink-400 md:table-cell">{fmtDate(u.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <Tooltip content="Cambiar rol">
                              <button
                                onClick={() => {
                                  setRoleTarget(u);
                                  setNuevoRol(u.rolNombre);
                                }}
                                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                              >
                                <UserCog className="h-4 w-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-xs text-ink-400">
                  {meta.total} usuario{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages || 1}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                    Anterior
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Crear usuario */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nuevo usuario"
        description="Crea una cuenta de acceso para el personal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit((v) => crear.mutate(v))} loading={crear.isPending}>Crear usuario</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit((v) => crear.mutate(v))} className="grid grid-cols-2 gap-3">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
          <div className="col-span-2">
            <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="col-span-2">
            <Input label="Contraseña" type="password" error={errors.password?.message} hint="8+ con mayúscula, minúscula, número y especial" {...register('password')} />
          </div>
          <div className="col-span-2">
            <Select label="Rol" error={errors.rolNombre?.message} {...register('rolNombre')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>

      {/* Cambiar rol */}
      <Modal
        open={!!roleTarget}
        onOpenChange={(o) => !o && setRoleTarget(null)}
        title="Cambiar rol"
        description={roleTarget ? `${roleTarget.nombre} ${roleTarget.apellido}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancelar</Button>
            <Button onClick={() => asignar.mutate()} loading={asignar.isPending}>Guardar</Button>
          </>
        }
      >
        <Select label="Nuevo rol" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
