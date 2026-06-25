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
  Tooltip,
} from '@/components/ui';
import { EstadoCitaBadge } from '@/components/domain/StatusBadge';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { useMedicos } from '@/hooks/useMedicos';
import { useActivityStore, type RecentCita } from '@/store/activity.store';
import { citasApi } from '@/api/citas.api';
import { apiError } from '@/api/http';
import { combinarFechaHora, generarSlots, hoyISO } from '@/lib/slots';
import { fmtDateTime } from '@/lib/format';
import type { Paciente } from '@/types';

const SLOTS = generarSlots();

export default function CitasPage() {
  const location = useLocation();
  const prefill = (location.state as { paciente?: Paciente } | null)?.paciente ?? null;

  const { data: medicos } = useMedicos();
  const { citas, addCita, updateCita } = useActivityStore();

  const [paciente, setPaciente] = useState<Paciente | null>(prefill);
  const [idMedico, setIdMedico] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState('09:00');

  const [cancelTarget, setCancelTarget] = useState<RecentCita | null>(null);
  const [motivo, setMotivo] = useState('');
  const [reprogTarget, setReprogTarget] = useState<RecentCita | null>(null);
  const [reprogFecha, setReprogFecha] = useState(hoyISO());
  const [reprogHora, setReprogHora] = useState('09:00');

  const medicoNombre = (id: string) => {
    const m = medicos?.find((x) => x.id_medico === id);
    return m ? `${m.nombre} ${m.apellido}` : id;
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
      setEspecialidad('');
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
      <PageHeader title="Citas" subtitle="Agenda y gestiona las citas de los pacientes" />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Formulario */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <CalendarPlus className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Agendar cita</h3>
          </div>
          <CardBody className="space-y-4">
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
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <Input label="Especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Ej. Cardiología" />

            <Button className="w-full" disabled={!canSubmit} loading={reservar.isPending} onClick={() => reservar.mutate()}>
              Agendar cita
            </Button>
          </CardBody>
        </Card>

        {/* Citas recientes */}
        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <CalendarDays className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Citas recientes</h3>
          </div>
          {citas.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sin citas registradas" description="Las citas que agendes aparecerán aquí con sus acciones." />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {citas.map((c) => (
                <motion.li
                  key={c.idCita}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-100">{c.pacienteNombre ?? c.idPaciente}</p>
                      <EstadoCitaBadge estado={c.estado} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {c.especialidad} · {c.medicoNombre} · {fmtDateTime(c.fechaHora)}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-600">{c.idCita}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.estado === 'Pendiente' && (
                      <>
                        <Tooltip content="Registrar ingreso">
                          <button
                            onClick={() => ingreso.mutate(c.idCita)}
                            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-emerald-300"
                          >
                            <LogIn className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Reprogramar">
                          <button
                            onClick={() => setReprogTarget(c)}
                            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </>
                    )}
                    {(c.estado === 'Pendiente' || c.estado === 'En_Atencion') && (
                      <Tooltip content="Cancelar">
                        <button
                          onClick={() => setCancelTarget(c)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip content="Actualizar estado">
                      <button
                        onClick={() => refrescar.mutate(c.idCita)}
                        className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Modal cancelar */}
      <Modal
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancelar cita"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Volver
            </Button>
            <Button variant="danger" loading={cancelar.isPending} onClick={() => cancelar.mutate()}>
              Cancelar cita
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-300">Indica el motivo de la cancelación (opcional).</p>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo…" />
      </Modal>

      {/* Modal reprogramar */}
      <Modal
        open={!!reprogTarget}
        onOpenChange={(o) => !o && setReprogTarget(null)}
        title="Reprogramar cita"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReprogTarget(null)}>
              Volver
            </Button>
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
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
