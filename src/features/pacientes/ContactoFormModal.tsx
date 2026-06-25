import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from '@/components/ui';
import { useActualizarContacto } from './usePacientes';
import { apiError } from '@/api/http';
import type { Paciente } from '@/types';

interface Props {
  paciente: Paciente | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ContactoFormModal({ paciente, open, onOpenChange }: Props) {
  const mutation = useActualizarContacto(paciente?.id_paciente ?? '');
  const { register, handleSubmit } = useForm({
    values: {
      telefono: paciente?.telefono ?? '',
      email: paciente?.email ?? '',
      direccion: paciente?.direccion ?? '',
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Actualizar contacto"
      description={paciente ? `${paciente.nombre} ${paciente.apellido}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit((v) =>
              mutation.mutate(
                { telefono: v.telefono, email: v.email || undefined, direccion: v.direccion || undefined },
                {
                  onSuccess: () => {
                    toast.success('Contacto actualizado (en proceso)');
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(apiError(err)),
                },
              ),
            )}
            loading={mutation.isPending}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Teléfono" {...register('telefono')} />
        <Input label="Correo" type="email" {...register('email')} />
        <Input label="Dirección" {...register('direccion')} />
      </div>
    </Modal>
  );
}
