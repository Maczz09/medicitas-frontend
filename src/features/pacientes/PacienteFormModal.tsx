import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useCrearPaciente } from './usePacientes';
import { apiError } from '@/api/http';
import type { CrearPacienteInput } from '@/types';

const schema = z
  .object({
    nombre: z.string().min(1, 'Requerido'),
    apellido: z.string().min(1, 'Requerido'),
    tipo_documento: z.enum(['DNI', 'CE', 'PASAPORTE']),
    numero_documento: z.string().min(1, 'Requerido'),
    fecha_nacimiento: z.string().min(1, 'Requerido'),
    sexo: z.enum(['M', 'F', 'Otro']),
    telefono: z.string().min(6, 'Teléfono inválido'),
    email: z.string().email('Correo inválido').optional().or(z.literal('')),
    direccion: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.tipo_documento === 'DNI' && !/^\d{8}$/.test(val.numero_documento)) {
      ctx.addIssue({ path: ['numero_documento'], code: 'custom', message: 'El DNI debe tener 8 dígitos' });
    }
    if (val.tipo_documento === 'CE' && !/^[A-Za-z0-9]{9}$/.test(val.numero_documento)) {
      ctx.addIssue({ path: ['numero_documento'], code: 'custom', message: 'El CE debe tener 9 caracteres' });
    }
    if (val.fecha_nacimiento && new Date(val.fecha_nacimiento) > new Date()) {
      ctx.addIssue({ path: ['fecha_nacimiento'], code: 'custom', message: 'No puede ser una fecha futura' });
    }
  });

type FormValues = z.infer<typeof schema>;

export function PacienteFormModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const mutation = useCrearPaciente();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipo_documento: 'DNI', sexo: 'M' },
  });

  const onSubmit = (values: FormValues) => {
    const payload: CrearPacienteInput = { ...values, email: values.email || undefined };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Paciente registrado');
        reset();
        onOpenChange(false);
      },
      onError: (err) => toast.error(apiError(err, 'No se pudo registrar')),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo paciente"
      description="Registra los datos del paciente"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={mutation.isPending}>
            Registrar paciente
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
        <Select label="Tipo de documento" error={errors.tipo_documento?.message} {...register('tipo_documento')}>
          <option value="DNI">DNI</option>
          <option value="CE">Carné de extranjería</option>
          <option value="PASAPORTE">Pasaporte</option>
        </Select>
        <Input label="N° de documento" error={errors.numero_documento?.message} {...register('numero_documento')} />
        <Input label="Fecha de nacimiento" type="date" error={errors.fecha_nacimiento?.message} {...register('fecha_nacimiento')} />
        <Select label="Sexo" error={errors.sexo?.message} {...register('sexo')}>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="Otro">Otro</option>
        </Select>
        <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
        <Input label="Correo (opcional)" type="email" error={errors.email?.message} {...register('email')} />
        <div className="sm:col-span-2">
          <Input label="Dirección (opcional)" error={errors.direccion?.message} {...register('direccion')} />
        </div>
      </form>
    </Modal>
  );
}
