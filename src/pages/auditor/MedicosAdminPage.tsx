import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgePlus, Pencil, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, SkeletonRows, Tooltip } from '@/components/ui';
import { MedicoEditModal } from '@/features/medicos/MedicoEditModal';
import { useMedicos } from '@/hooks/useMedicos';
import { medicosApi } from '@/api/medicos.api';
import { apiError } from '@/api/http';
import type { Medico } from '@/types';

const schema = z.object({
  cmp: z.string().min(1, 'Requerido'),
  nombre: z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  especialidad: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-z]/, 'Falta minúscula')
    .regex(/[A-Z]/, 'Falta mayúscula')
    .regex(/\d/, 'Falta número')
    .regex(/[@$!%*?&]/, 'Falta especial (@$!%*?&)'),
});
type FormValues = z.infer<typeof schema>;

export default function MedicosAdminPage() {
  const qc = useQueryClient();
  const { data: medicos, isLoading } = useMedicos();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Medico | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const crear = useMutation({
    mutationFn: medicosApi.crear,
    onSuccess: () => {
      toast.success('Médico registrado');
      qc.invalidateQueries({ queryKey: ['medicos'] });
      reset();
      setOpen(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo registrar el médico')),
  });

  return (
    <div>
      <PageHeader
        title="Médicos"
        subtitle="Personal médico de la clínica"
        actions={
          <Button leftIcon={<BadgePlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Nuevo médico
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={4} /></div>
        ) : !medicos?.length ? (
          <EmptyState icon={Stethoscope} title="Sin médicos" description="Registra el primer médico de la clínica." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                  <th className="px-5 py-3 font-medium">Médico</th>
                  <th className="px-5 py-3 font-medium">CMP</th>
                  <th className="px-5 py-3 font-medium">Especialidad</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((m, i) => (
                  <motion.tr key={m.id_medico} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${m.nombre} ${m.apellido}`} size="sm" />
                        <span className="font-medium text-ink-100">{m.nombre} {m.apellido}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-ink-300">{m.cmp}</td>
                    <td className="px-5 py-3 text-ink-200">{m.especialidad}</td>
                    <td className="px-5 py-3">
                      {m.activo === 0 || m.activo === false ? (
                        <Badge tone="neutral" dot>Inactivo</Badge>
                      ) : (
                        <Badge tone="success" dot>Activo</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Tooltip content="Editar médico">
                          <button onClick={() => setEditTarget(m)} className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Nuevo médico"
        description="Se crea el médico y su cuenta de acceso (rol Médico)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit((v) => crear.mutate(v))} loading={crear.isPending}>Registrar</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit((v) => crear.mutate(v))} className="grid grid-cols-2 gap-3">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
          <Input label="CMP" error={errors.cmp?.message} {...register('cmp')} />
          <Input label="Especialidad" error={errors.especialidad?.message} {...register('especialidad')} />
          <div className="col-span-2 mt-1 border-t border-white/[0.06] pt-3">
            <p className="mb-2 text-xs font-medium text-ink-400">Credenciales de acceso</p>
          </div>
          <div className="col-span-2">
            <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="col-span-2">
            <Input label="Contraseña" type="password" error={errors.password?.message} hint="8+ con mayúscula, minúscula, número y especial" {...register('password')} />
          </div>
        </form>
      </Modal>

      <MedicoEditModal medico={editTarget} open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
    </div>
  );
}
