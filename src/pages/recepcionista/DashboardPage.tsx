import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarPlus,
  Clock,
  CreditCard,
  Search,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, Card, CardBody, EmptyState } from '@/components/ui';
import { EstadoCitaBadge } from '@/components/domain/StatusBadge';
import { pacientesApi } from '@/api/pacientes.api';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import { useDebounce } from '@/hooks/useDebounce';
import type { Paciente } from '@/types';

const quickActions = [
  { label: 'Nuevo paciente',  icon: UserPlus,    to: '/recepcion/pacientes', grad: 'from-brand-500 to-indigo-600' },
  { label: 'Agendar cita',    icon: CalendarPlus, to: '/recepcion/citas',     grad: 'from-teal-500 to-emerald-600' },
  { label: 'Validar seguro',  icon: ShieldCheck,  to: '/recepcion/cobertura', grad: 'from-amber-500 to-orange-600' },
  { label: 'Registrar pago',  icon: CreditCard,   to: '/recepcion/pagos',     grad: 'from-violet-500 to-purple-600' },
];

const TODAY_START = new Date();
TODAY_START.setHours(0, 0, 0, 0);
const TODAY_END = new Date();
TODAY_END.setHours(23, 59, 59, 999);

function isToday(iso: string) {
  const d = new Date(iso);
  return d >= TODAY_START && d <= TODAY_END;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { citas } = useActivityStore();

  const [q, setQ] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const dq = useDebounce(q, 300);

  const { data: searchData } = useQuery({
    queryKey: ['pac-search-dash', dq],
    queryFn: () => pacientesApi.list({ q: dq, page: 1, limit: 5 }),
    enabled: dq.length >= 2,
    staleTime: 30_000,
  });

  const firstName = user?.nombre?.split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Solo mostrar citas activas de hoy ordenadas por hora
  const citasActivas = citas
    .filter((c) => ['En_Atencion', 'Pendiente'].includes(c.estado) && c.fechaHora && isToday(c.fechaHora))
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

  const enAtencion = citasActivas.filter((c) => c.estado === 'En_Atencion');
  const pendientes  = citasActivas.filter((c) => c.estado === 'Pendiente');
  const LIMIT = 5;

  const goToPaciente = (p: Paciente) => {
    setQ('');
    setDropOpen(false);
    navigate(`/recepcion/pacientes/${p.id_paciente}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Hero: patient search ── */}
      {/* NO overflow-hidden aquí — recortaría el dropdown del buscador */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-brand-600/20 via-navy-850 to-navy-900 p-6 sm:p-8">
        <p className="text-sm text-ink-400">{greeting},</p>
        <h1 className="mt-0.5 font-display text-2xl font-bold text-ink-100">{firstName}</h1>
        <p className="mt-1 text-sm text-ink-400">¿A quién estás atendiendo hoy?</p>

        <div className="relative mt-4 max-w-lg">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar paciente por nombre o documento…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
              onBlur={() => setTimeout(() => setDropOpen(false), 150)}
              className="h-11 w-full rounded-xl border border-white/[0.12] bg-navy-900/80 pl-9 pr-4 text-sm text-ink-100 placeholder:text-ink-500 backdrop-blur-sm focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
            />
          </div>
          <AnimatePresence>
            {dropOpen && dq.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/[0.08] bg-navy-850 shadow-2xl"
              >
                {!searchData?.data?.length ? (
                  <div className="px-4 py-3 text-sm text-ink-400">Sin resultados para «{dq}»</div>
                ) : (
                  <ul>
                    {searchData.data.map((p) => (
                      <li key={p.id_paciente}>
                        <button
                          onMouseDown={() => goToPaciente(p)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
                        >
                          <Avatar name={`${p.nombre} ${p.apellido}`} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-100">
                              {p.nombre} {p.apellido}
                            </p>
                            <p className="text-xs text-ink-500">
                              {p.tipo_documento} {p.numero_documento}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-ink-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            whileHover={{ y: -2, scale: 1.02 }}
            onClick={() => navigate(a.to)}
            className="glass flex flex-col items-center gap-3 rounded-2xl p-5 text-center shadow-card transition-all hover:bg-white/[0.05]"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} shadow-glow-sm`}>
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium leading-tight text-ink-100">{a.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── Patient queue ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-200">Cola de atención</h2>
            <p className="text-xs text-ink-500">Citas de hoy · {citasActivas.length} activas</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/recepcion/citas')}>
            Ver todas las citas
          </Button>
        </div>

        {citasActivas.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={CalendarPlus}
                title="Sin citas para hoy"
                description="Agenda una cita para empezar a atender pacientes."
                action={
                  <Button onClick={() => navigate('/recepcion/citas')} leftIcon={<CalendarPlus className="h-4 w-4" />}>
                    Agendar cita
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {enAtencion.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  En atención · {enAtencion.length}
                </p>
                <div className="space-y-2">
                  {enAtencion.map((c, i) => (
                    <QueueCard key={c.idCita} cita={c} position={i + 1} active />
                  ))}
                </div>
              </section>
            )}

            {pendientes.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Próximas · {pendientes.length}
                </p>
                <div className="space-y-2">
                  {pendientes.slice(0, LIMIT).map((c, i) => (
                    <QueueCard key={c.idCita} cita={c} position={enAtencion.length + i + 1} />
                  ))}
                  {pendientes.length > LIMIT && (
                    <button
                      onClick={() => navigate('/recepcion/citas')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.05] py-3 text-xs text-ink-500 transition-colors hover:bg-white/[0.03] hover:text-ink-300"
                    >
                      Ver {pendientes.length - LIMIT} citas más
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({
  cita,
  position,
  active,
}: {
  cita: any;
  position: number;
  active?: boolean;
}) {
  const navigate = useNavigate();
  const nombre = cita.pacienteNombre ?? cita.idPaciente;
  const timeStr = cita.fechaHora ? formatTime(cita.fechaHora) : '—';
  const dateStr = cita.fechaHora ? formatDate(cita.fechaHora) : '';
  const isNow = isToday(cita.fechaHora ?? '');

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.04 }}
      onClick={() => navigate('/recepcion/citas')}
      className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-emerald-500/25 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.09]'
          : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      {/* Posición en cola */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          active
            ? 'bg-emerald-500/30 text-emerald-300'
            : 'bg-white/[0.08] text-ink-500'
        }`}
      >
        {position}
      </div>

      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          active
            ? 'bg-emerald-500/20 text-emerald-200'
            : 'bg-brand-500/15 text-brand-300'
        }`}
      >
        {initials(nombre)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-100">{nombre}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
          <Stethoscope className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {cita.especialidad}
            {cita.medicoNombre ? ` · ${cita.medicoNombre}` : ''}
          </span>
        </div>
      </div>

      {/* Hora + estado */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <EstadoCitaBadge estado={cita.estado} />
        <div className={`flex items-center gap-1 text-xs ${active ? 'text-emerald-400' : 'text-ink-400'}`}>
          <Clock className="h-3 w-3" />
          <span className="font-medium">{timeStr}</span>
          {!isNow && <span className="text-ink-600">· {dateStr}</span>}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-700 transition-colors group-hover:text-ink-400" />
    </motion.button>
  );
}
