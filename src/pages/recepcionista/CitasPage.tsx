import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  CalendarDays,
  LogIn,
  RefreshCw,
  RotateCcw,
  CalendarClock,
  XCircle,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
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
import type { Paciente } from '@/types';

const SLOTS = generarSlots();

type Filtro = 'todas' | 'hoy' | 'pendientes' | 'en_atencion' | 'finalizadas';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todas',       label: 'Todas' },
  { key: 'hoy',         label: 'Hoy' },
  { key: 'pendientes',  label: 'Pendientes' },
  { key: 'en_atencion', label: 'En atención' },
  { key: 'finalizadas', label: 'Finalizadas' },
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const esHoy =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const fecha = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  return { hora, fecha, esHoy };
}

function shortId(id: string) {
  const parts = id.split('-');
  return `#${parts[parts.length - 1]}`;
}

export default function CitasPage() {
  const location = useLocation();
  const prefill = (location.state as { paciente?: Paciente } | null)?.paciente ?? null;

  const navigate = useNavigate();
  const { data: medicos } = useMedicos();
  const { citas, pagos, addCita, updateCita } = useActivityStore();

  const [filtro, setFiltro] = useState<Filtro>('todas');

  const estaPagada = (idCita: string) =>
    pagos.some((p) => p.idCita === idCita && p.estado !== 'REVERSADO');

  const [agendarOpen, setAgendarOpen]     = useState(!!prefill);
  const [paciente, setPaciente]           = useState<Paciente | null>(prefill);
  const [idMedico, setIdMedico]           = useState('');
  const [especialidad, setEspecialidad]   = useState('');
  const [fecha, setFecha]                 = useState(hoyISO());
  const [hora, setHora]                   = useState('09:00');
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
    setPaciente(null); setIdMedico(''); setEspecialidad('');
    setFecha(hoyISO()); setHora('09:00');
  };

  const reservar = useMutation({
    mutationFn: () =>
      citasApi.reservar(
        { idPaciente: paciente!.id_paciente, idMedico, fechaHora: combinarFechaHora(fecha, hora), especialidad },
        crypto.randomUUID(),
      ),
    onSuccess: (cita) => {
      addCita({
        idCita: cita.idCita, idPaciente: cita.idPaciente, idMedico: cita.idMedico,
        fechaHora: cita.fechaHora, especialidad: cita.especialidad, estado: cita.estado,
        pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : undefined,
        medicoNombre: medicoNombre(cita.idMedico), ts: Date.now(),
      });
      toast.success('Cita agendada correctamente');
      resetForm(); setAgendarOpen(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo agendar la cita')),
  });

  const ingreso = useMutation({
    mutationFn: (idCita: string) => citasApi.registrarIngreso(idCita),
    onSuccess: (cita) => { updateCita(cita.idCita, { estado: 'En_Atencion' }); toast.success('Ingreso registrado'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const refrescar = useMutation({
    mutationFn: (idCita: string) => citasApi.getById(idCita),
    onSuccess: (cita) => { updateCita(cita.idCita, { estado: cita.estado }); toast.success('Estado sincronizado'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const revertirIngreso = useMutation({
    mutationFn: (idCita: string) => citasApi.revertirIngreso(idCita),
    onSuccess: (cita) => { updateCita(cita.idCita, { estado: 'Pendiente' }); toast.success('Ingreso revertido'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const cancelar = useMutation({
    mutationFn: () => citasApi.cancelar(cancelTarget!.idCita, motivo || undefined),
    onSuccess: (cita) => {
      updateCita(cita.idCita, { estado: 'Cancelada' });
      toast.success('Cita cancelada'); setCancelTarget(null); setMotivo('');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const reprogramar = useMutation({
    mutationFn: () =>
      citasApi.reprogramar(reprogTarget!.idCita, { nuevaFechaHora: combinarFechaHora(reprogFecha, reprogHora) }),
    onSuccess: (cita) => {
      updateCita(cita.idCita, { fechaHora: cita.fechaHora ?? combinarFechaHora(reprogFecha, reprogHora) });
      toast.success('Cita reprogramada'); setReprogTarget(null);
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const canSubmit = paciente && idMedico && especialidad && fecha && hora;

  // Filtrado y ordenado
  const hoyStr = hoyISO();
  const citasFiltradas = citas
    .filter((c) => {
      if (filtro === 'hoy') return c.fechaHora?.startsWith(hoyStr);
      if (filtro === 'pendientes') return c.estado === 'Pendiente';
      if (filtro === 'en_atencion') return c.estado === 'En_Atencion';
      if (filtro === 'finalizadas') return ['Completada', 'Cancelada', 'No_Asistida'].includes(c.estado);
      return true;
    })
    .sort((a, b) => {
      // En_Atencion primero, luego Pendiente, luego el resto
      const prioridad = (e: string) => e === 'En_Atencion' ? 0 : e === 'Pendiente' ? 1 : 2;
      const diff = prioridad(a.estado) - prioridad(b.estado);
      if (diff !== 0) return diff;
      return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
    });

  // Contadores para tabs
  const counts: Record<Filtro, number> = {
    todas:       citas.length,
    hoy:         citas.filter((c) => c.fechaHora?.startsWith(hoyStr)).length,
    pendientes:  citas.filter((c) => c.estado === 'Pendiente').length,
    en_atencion: citas.filter((c) => c.estado === 'En_Atencion').length,
    finalizadas: citas.filter((c) => ['Completada', 'Cancelada', 'No_Asistida'].includes(c.estado)).length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Citas"
        subtitle="Agenda y gestiona las citas de los pacientes"
        actions={
          <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setAgendarOpen(true)}>
            Agendar cita
          </Button>
        }
      />

      {/* Tabs de filtro */}
      {citas.length > 0 && (
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filtro === f.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:bg-white/[0.05] hover:text-ink-200'
              }`}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    filtro === f.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-ink-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
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
      ) : citasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-500">
          <CalendarDays className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No hay citas en esta categoría.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {citasFiltradas.map((c, i) => (
              <CitaCard
                key={c.idCita}
                cita={c}
                index={i}
                pagada={estaPagada(c.idCita)}
                onIngreso={() => ingreso.mutate(c.idCita)}
                onRevertir={() => revertirIngreso.mutate(c.idCita)}
                onCancelar={() => setCancelTarget(c)}
                onReprogramar={() => setReprogTarget(c)}
                onRefrescar={() => refrescar.mutate(c.idCita)}
                onPago={() => navigate('/recepcion/pagos')}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modal: Agendar */}
      <Modal
        open={agendarOpen}
        onOpenChange={(o) => { if (!o) resetForm(); setAgendarOpen(o); }}
        title="Agendar cita"
        description="Completa los datos para reservar un turno"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { resetForm(); setAgendarOpen(false); }}>Cancelar</Button>
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
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* Modal: Cancelar */}
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

      {/* Modal: Reprogramar */}
      <Modal
        open={!!reprogTarget}
        onOpenChange={(o) => !o && setReprogTarget(null)}
        title="Reprogramar cita"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReprogTarget(null)}>Volver</Button>
            <Button loading={reprogramar.isPending} onClick={() => reprogramar.mutate()}>Reprogramar</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nueva fecha" type="date" min={hoyISO()} value={reprogFecha} onChange={(e) => setReprogFecha(e.target.value)} />
          <Select label="Nueva hora" value={reprogHora} onChange={(e) => setReprogHora(e.target.value)}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </Modal>
    </div>
  );
}

// ── CitaCard ──────────────────────────────────────────────────────────────────

function CitaCard({
  cita, index, pagada,
  onIngreso, onRevertir, onCancelar, onReprogramar, onRefrescar, onPago,
}: {
  cita: RecentCita;
  index: number;
  pagada: boolean;
  onIngreso: () => void;
  onRevertir: () => void;
  onCancelar: () => void;
  onReprogramar: () => void;
  onRefrescar: () => void;
  onPago: () => void;
}) {
  const nombre = cita.pacienteNombre ?? cita.idPaciente;
  const { hora, fecha, esHoy } = cita.fechaHora
    ? formatFechaHora(cita.fechaHora)
    : { hora: '—', fecha: '—', esHoy: false };

  const isActive    = cita.estado === 'En_Atencion';
  const isPending   = cita.estado === 'Pendiente';
  const isClosed    = ['Cancelada', 'No_Asistida', 'Completada'].includes(cita.estado);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative overflow-hidden rounded-xl border transition-colors ${
        isActive
          ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
          : isClosed
          ? 'border-white/[0.04] bg-white/[0.01] opacity-60'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035]'
      }`}
    >
      {/* Barra lateral de color por estado */}
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${
          isActive  ? 'bg-emerald-500' :
          isPending ? 'bg-brand-500'   :
          cita.estado === 'Completada' ? 'bg-sky-500' :
          cita.estado === 'Cancelada'  ? 'bg-rose-500/60' :
          'bg-amber-500/60'
        }`}
      />

      <div className="flex flex-wrap items-center gap-4 px-5 py-4 pl-6">

        {/* Avatar con iniciales */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            isActive  ? 'bg-emerald-500/20 text-emerald-200' :
            isClosed  ? 'bg-white/[0.06] text-ink-500'       :
                        'bg-brand-500/15 text-brand-300'
          }`}
        >
          {initials(nombre)}
        </div>

        {/* Información principal */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-semibold ${isClosed ? 'text-ink-400' : 'text-ink-100'}`}>
              {nombre}
            </span>
            <EstadoCitaBadge estado={cita.estado} />
            <span className="font-mono text-[10px] text-ink-600">{shortId(cita.idCita)}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3 shrink-0" />
              {cita.medicoNombre ?? 'Sin médico asignado'}
            </span>
            {cita.especialidad && (
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-ink-400">
                {cita.especialidad}
              </span>
            )}
          </div>
        </div>

        {/* Hora y fecha */}
        <div className={`flex shrink-0 flex-col items-end text-right ${isClosed ? 'text-ink-600' : ''}`}>
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${isActive ? 'text-emerald-300' : 'text-ink-200'}`}>
            <Clock className="h-3.5 w-3.5" />
            {hora}
          </div>
          <span className={`text-[11px] capitalize ${esHoy ? 'text-brand-400' : 'text-ink-600'}`}>
            {esHoy ? 'Hoy' : fecha}
          </span>
        </div>

        {/* Acciones */}
        {!isClosed && (
          <div className="flex shrink-0 items-center gap-1 border-l border-white/[0.06] pl-4">
            {isPending && (
              <>
                {pagada ? (
                  <Tooltip content="Registrar ingreso al consultorio">
                    <ActionBtn icon={LogIn} label="Ingreso" onClick={onIngreso} variant="success" />
                  </Tooltip>
                ) : (
                  <Tooltip content="Debe registrar el pago primero">
                    <ActionBtn icon={AlertCircle} label="Pago" onClick={onPago} variant="warning" />
                  </Tooltip>
                )}
                <Tooltip content="Reprogramar cita">
                  <ActionBtn icon={CalendarClock} label="Reprogramar" onClick={onReprogramar} variant="default" />
                </Tooltip>
              </>
            )}

            {isActive && (
              <Tooltip content="Revertir ingreso a Pendiente">
                <ActionBtn icon={RotateCcw} label="Revertir" onClick={onRevertir} variant="warning" />
              </Tooltip>
            )}

            <Tooltip content="Cancelar cita">
              <ActionBtn icon={XCircle} label="Cancelar" onClick={onCancelar} variant="danger" />
            </Tooltip>

            <Tooltip content="Sincronizar estado con el servidor">
              <ActionBtn icon={RefreshCw} label="Sync" onClick={onRefrescar} variant="default" />
            </Tooltip>
          </div>
        )}

        {/* Estado final */}
        {isClosed && (
          <div className="flex shrink-0 items-center gap-1.5 border-l border-white/[0.06] pl-4">
            <Tooltip content="Sincronizar estado">
              <ActionBtn icon={RefreshCw} label="Sync" onClick={onRefrescar} variant="default" />
            </Tooltip>
            {cita.estado === 'Completada' && (
              <CheckCircle2 className="h-4 w-4 text-sky-500/60" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick, variant,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colors = {
    default: 'text-ink-500 hover:bg-white/[0.06] hover:text-ink-200',
    success: 'text-emerald-500/80 hover:bg-emerald-500/10 hover:text-emerald-300',
    warning: 'text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-300',
    danger:  'text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`rounded-lg p-2 transition-colors ${colors[variant]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
