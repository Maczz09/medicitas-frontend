import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarPlus,
  CalendarDays,
  LogIn,
  RefreshCw,
  CalendarClock,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
} from '@/components/ui';
import { EstadoCitaBadge } from '@/components/domain/StatusBadge';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { useMedicos } from '@/hooks/useMedicos';
import { useActivityStore, type RecentCita } from '@/store/activity.store';
import { citasApi } from '@/api/citas.api';
import { apiError } from '@/api/http';
import { combinarFechaHora, generarSlots, hoyISO } from '@/lib/slots';
import type { Paciente } from '@/types';

const SLOTS = generarSlots();

export default function CitasPage() {
  const location = useLocation();
  const prefill = (location.state as { paciente?: Paciente } | null)?.paciente ?? null;

  const { data: medicos } = useMedicos();
  const { citas, addCita, updateCita } = useActivityStore();

  // Agendar form state
  const [agendarOpen, setAgendarOpen] = useState(!!prefill);
  const [paciente, setPaciente]       = useState<Paciente | null>(prefill);
  const [idMedico, setIdMedico]       = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [fecha, setFecha]             = useState(hoyISO());
  const [hora, setHora]               = useState('09:00');

  // Cancel / reschedule
  const [cancelTarget, setCancelTarget]   = useState<RecentCita | null>(null);
  const [motivo, setMotivo]               = useState('');
  const [reprogTarget, setReprogTarget]   = useState<RecentCita | null>(null);
  const [reprogFecha, setReprogFecha]     = useState(hoyISO());
  const [reprogHora, setReprogHora]       = useState('09:00');

  const medicoNombre = (id: string) => {
    const m = medicos?.find((x) => x.id_medico === id);
    return m ? `${m.nombre} ${m.apellido}` : id;
  };

  const resetForm = () => {
    setPaciente(null);
    setIdMedico('');
    setEspecialidad('');
    setFecha(hoyISO());
    setHora('09:00');
  };

  const reservar = useMutation({
    mutationFn: () =>
      citasApi.reservar(
        { idPaciente: paciente!.id_paciente, idMedico, fechaHora: combinarFechaHora(fecha, hora), especialidad },
        crypto.randomUUID(),
      ),
    onSuccess: (cita) => {
      addCita({
        idCita: cita.idCita,
        idPaciente: cita.idPaciente,
        idMedico: cita.idMedico,
        fechaHora: cita.fechaHora,
        especialidad: cita.especialidad,
        estado: cita.estado,
        pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : undefined,
        medicoNombre: medicoNombre(cita.idMedico),
        ts: Date.now(),
      });
      toast.success('Cita agendada correctamente');
      resetForm();
      setAgendarOpen(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo agendar la cita')),
  });

  const ingreso = useMutation({
    mutationFn: (idCita: string) => citasApi.registrarIngreso(idCita),
    onSuccess: (cita) => {
      updateCita(cita.idCita, { estado: 'En_Atencion' });
      toast.success('Ingreso registrado');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const refrescar = useMutation({
    mutationFn: (idCita: string) => citasApi.getById(idCita),
    onSuccess: (cita) => updateCita(cita.idCita, { estado: cita.estado }),
    onError: (err) => toast.error(apiError(err)),
  });

  const cancelar = useMutation({
    mutationFn: () => citasApi.cancelar(cancelTarget!.idCita, motivo || undefined),
    onSuccess: (cita) => {
      updateCita(cita.idCita, { estado: 'Cancelada' });
      toast.success('Cita cancelada');
      setCancelTarget(null);
      setMotivo('');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const reprogramar = useMutation({
    mutationFn: () =>
      citasApi.reprogramar(reprogTarget!.idCita, {
        nuevaFechaHora: combinarFechaHora(reprogFecha, reprogHora),
      }),
    onSuccess: (cita) => {
      updateCita(cita.idCita, { fechaHora: cita.fechaHora ?? combinarFechaHora(reprogFecha, reprogHora) });
      toast.success('Cita reprogramada');
      setReprogTarget(null);
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const canSubmit = paciente && idMedico && especialidad && fecha && hora;

  return (
    <div>
      <PageHeader
        title="Citas"
        subtitle="Agenda y gestiona las citas de los pacientes"
        actions={
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setAgendarOpen(true)}>
            Agendar cita
          </Button>
        }
      />

      {/* Appointment list */}
      {citas.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={CalendarDays}
              title="Sin citas registradas"
              description="Las citas que agendes aparecerán aquí con sus acciones."
              action={
                <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setAgendarOpen(true)}>
                  Agendar primera cita
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {citas.map((c, i) => {
            const timeStr = c.fechaHora
              ? new Date(c.fechaHora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              : '—';
            const dateStr = c.fechaHora
              ? new Date(c.fechaHora).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
              : '—';
            const isActive = c.estado === 'En_Atencion';

            return (
              <motion.div
                key={c.idCita}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Time bubble */}
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-500/15 text-brand-300'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="mt-0.5 text-sm font-bold leading-none">{timeStr}</span>
                  <span className="mt-0.5 text-[9px] leading-none text-current/70 capitalize">{dateStr}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-100">{c.pacienteNombre ?? c.idPaciente}</p>
                    <EstadoCitaBadge estado={c.estado} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {c.medicoNombre ?? 'Sin médico'}
                    </span>
                    {c.especialidad && <span>{c.especialidad}</span>}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-600">{c.idCita}</p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  {c.estado === 'Pendiente' && (
                    <>
                      <ActionBtn
                        icon={LogIn}
                        label="Registrar ingreso"
                        onClick={() => ingreso.mutate(c.idCita)}
                        color="hover:text-emerald-300"
                      />
                      <ActionBtn
                        icon={CalendarClock}
                        label="Reprogramar"
                        onClick={() => setReprogTarget(c)}
                        color="hover:text-brand-300"
                      />
                    </>
                  )}
                  {(c.estado === 'Pendiente' || c.estado === 'En_Atencion') && (
                    <ActionBtn
                      icon={XCircle}
                      label="Cancelar"
                      onClick={() => setCancelTarget(c)}
                      color="hover:text-rose-300"
                    />
                  )}
                  <ActionBtn
                    icon={RefreshCw}
                    label="Actualizar estado"
                    onClick={() => refrescar.mutate(c.idCita)}
                    color="hover:text-brand-300"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Agendar cita ── */}
      <Modal
        open={agendarOpen}
        onOpenChange={(o) => { if (!o) resetForm(); setAgendarOpen(o); }}
        title="Agendar cita"
        description="Completa los datos para reservar un turno"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { resetForm(); setAgendarOpen(false); }}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} loading={reservar.isPending} onClick={() => reservar.mutate()}>
              Agendar cita
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <PatientPicker value={paciente} onChange={setPaciente} />

          <Select
            label="Médico"
            value={idMedico}
            onChange={(e) => {
              setIdMedico(e.target.value);
              const m = medicos?.find((x) => x.id_medico === e.target.value);
              if (m) setEspecialidad(m.especialidad);
            }}
          >
            <option value="">Selecciona un médico…</option>
            {medicos?.map((m) => (
              <option key={m.id_medico} value={m.id_medico}>
                {m.nombre} {m.apellido} — {m.especialidad}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha" type="date" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Select label="Hora" value={hora} onChange={(e) => setHora(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Especialidad"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Ej. Cardiología"
          />
        </div>
      </Modal>

      {/* ── Modal: Cancelar ── */}
      <Modal
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancelar cita"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>Volver</Button>
            <Button variant="danger" loading={cancelar.isPending} onClick={() => cancelar.mutate()}>
              Cancelar cita
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-300">Indica el motivo de la cancelación (opcional).</p>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo…" />
      </Modal>

      {/* ── Modal: Reprogramar ── */}
      <Modal
        open={!!reprogTarget}
        onOpenChange={(o) => !o && setReprogTarget(null)}
        title="Reprogramar cita"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReprogTarget(null)}>Volver</Button>
            <Button loading={reprogramar.isPending} onClick={() => reprogramar.mutate()}>
              Reprogramar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nueva fecha" type="date" min={hoyISO()} value={reprogFecha} onChange={(e) => setReprogFecha(e.target.value)} />
          <Select label="Nueva hora" value={reprogHora} onChange={(e) => setReprogHora(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] ${color}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
