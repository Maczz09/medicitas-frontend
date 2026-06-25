import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  IdCard,
  Cake,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, CardBody, FullSpinner, EmptyState } from '@/components/ui';
import { ContactoFormModal } from '@/features/pacientes/ContactoFormModal';
import { usePaciente } from '@/features/pacientes/usePacientes';
import { edadDesde, fmtDate } from '@/lib/format';

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="truncate text-sm text-ink-100">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function PacienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: paciente, isLoading, isError } = usePaciente(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <FullSpinner label="Cargando paciente…" />;
  if (isError || !paciente)
    return (
      <Card>
        <CardBody>
          <EmptyState title="Paciente no encontrado" description="El paciente que buscas no existe o fue removido." />
        </CardBody>
      </Card>
    );

  const activo = paciente.activo === 1 || paciente.activo === true;
  const edad = edadDesde(paciente.fecha_nacimiento);

  return (
    <div>
      <button
        onClick={() => navigate('/recepcion/pacientes')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </button>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tarjeta de perfil */}
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={`${paciente.nombre} ${paciente.apellido}`} size="lg" className="h-20 w-20 text-2xl" />
            <h2 className="mt-4 font-display text-lg font-bold text-ink-100">
              {paciente.nombre} {paciente.apellido}
            </h2>
            <p className="mt-0.5 font-mono text-sm text-ink-400">
              {paciente.tipo_documento} · {paciente.numero_documento}
            </p>
            <div className="mt-3">
              {activo ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="neutral" dot>Inactivo</Badge>}
            </div>
            <div className="mt-5 grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="text-xs text-ink-500">Edad</p>
                <p className="text-lg font-bold text-ink-100">{edad ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="text-xs text-ink-500">Sexo</p>
                <p className="text-lg font-bold text-ink-100">{paciente.sexo}</p>
              </div>
            </div>
            <Button variant="secondary" className="mt-4 w-full" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Editar contacto
            </Button>
          </CardBody>
        </Card>

        {/* Información + acciones */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardBody className="space-y-3">
              <h3 className="text-sm font-semibold text-ink-200">Información de contacto</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={Phone} label="Teléfono" value={paciente.telefono} />
                <InfoRow icon={Mail} label="Correo" value={paciente.email} />
                <InfoRow icon={MapPin} label="Dirección" value={paciente.direccion} />
                <InfoRow icon={Cake} label="Nacimiento" value={fmtDate(paciente.fecha_nacimiento)} />
                <InfoRow icon={IdCard} label="ID paciente" value={paciente.id_paciente} />
                <InfoRow icon={Cake} label="Registrado" value={fmtDate(paciente.created_at)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="mb-3 text-sm font-semibold text-ink-200">Acciones rápidas</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  variant="secondary"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => navigate('/recepcion/citas', { state: { paciente } })}
                >
                  <CalendarPlus className="h-5 w-5 text-brand-300" />
                  Agendar cita
                </Button>
                <Button
                  variant="secondary"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => navigate('/recepcion/cobertura', { state: { paciente } })}
                >
                  <ShieldCheck className="h-5 w-5 text-brand-300" />
                  Validar seguro
                </Button>
                <Button
                  variant="secondary"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => navigate('/recepcion/pagos', { state: { paciente } })}
                >
                  <CreditCard className="h-5 w-5 text-brand-300" />
                  Registrar pago
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <ContactoFormModal paciente={paciente} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
