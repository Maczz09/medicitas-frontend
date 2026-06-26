import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from '@/components/ui';
import { medicosApi } from '@/api/medicos.api';
import { apiError } from '@/api/http';
import type { ActualizarMedicoInput, Medico } from '@/types';

interface Props {
  medico: Medico | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface FormValues {
  nombre: string;
  apellido: string;
  cmp: string;
  especialidad: string;
  activo: boolean;
}

/** Edición completa de un médico con todos los campos precargados. */
export function MedicoEditModal({ medico, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>({
    values: {
      nombre: medico?.nombre ?? '',
      apellido: medico?.apellido ?? '',
      cmp: medico?.cmp ?? '',
      especialidad: medico?.especialidad ?? '',
      activo: medico ? medico.activo === 1 || medico.activo === true : true,
    },
  });

  const mutation = useMutation({
    mutationFn: (body: ActualizarMedicoInput) => medicosApi.update(medico!.id_medico, body),
    onSuccess: () => {
      toast.success('Médico actualizado');
      qc.invalidateQueries({ queryKey: ['medicos'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar')),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Editar médico"
      description={medico ? `${medico.nombre} ${medico.apellido}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-2 gap-3">
        <Input label="Nombre" {...register('nombre')} />
        <Input label="Apellido" {...register('apellido')} />
        <Input label="CMP" {...register('cmp')} />
        <Input label="Especialidad" {...register('especialidad')} />
        <label className="col-span-2 mt-1 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <input type="checkbox" {...register('activo')} className="h-4 w-4 accent-brand-500" />
          <span className="text-sm text-ink-200">Médico activo (disponible para citas)</span>
        </label>
      </form>
    </Modal>
  );
}
