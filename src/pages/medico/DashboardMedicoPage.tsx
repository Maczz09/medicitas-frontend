import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  ChevronRight,
  Clock,
  FileHeart,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { Button, Card, CardBody, EmptyState } from '@/components/ui';
import { EstadoCitaBadge } from '@/components/domain/StatusBadge';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import { fmtDateTime } from '@/lib/format';

const navLinks = [
  { label: 'Nueva atención',  icon: Stethoscope,  to: '/medico/atencion',  cls: 'text-emerald-300 bg-emerald-500/15' },
  { label: 'Mi agenda',       icon: CalendarClock, to: '/medico/agenda',    cls: 'text-brand-300 bg-brand-500/15' },
  { label: 'Historia clínica',icon: FileHeart,     to: '/medico/historias', cls: 'text-amber-300 bg-amber-500/15' },
  { label: 'Mis recetas',     icon: Pill,          to: '/medico/recetas',   cls: 'text-violet-300 bg-violet-500/15' },
];

export default function DashboardMedicoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { citas, recetas } = useActivityStore();

  const enAtencion = citas.filter((c) => c.estado === 'En_Atencion');
  const pendientes  = citas.filter((c) => c.estado === 'Pendiente');

  const nombre = user?.nombre ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">
      {/* ── Greeting ── */}
      <div>
        <p className="text-sm text-ink-400">{greeting}</p>
        <h1 className="mt-0.5 font-display text-2xl font-bold text-ink-100">Dr(a). {nombre}</h1>
        <p className="mt-1 text-sm text-ink-400">Tu jornada clínica de hoy.</p>
      </div>

      {/* ── Mini stats strip ── */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { label: 'En atención',     value: enAtencion.length, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pendientes',      value: pendientes.length,  cls: 'text-brand-300 bg-brand-500/10 border-brand-500/20' },
          { label: 'Recetas emitidas',value: recetas.length,     cls: 'text-violet-300 bg-violet-500/10 border-violet-500/20' },
          { label: 'Total citas',     value: citas.length,       cls: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex shrink-0 flex-col items-center rounded-xl border px-5 py-3 ${s.cls}`}
          >
            <span className="font-display text-2xl font-bold">{s.value}</span>
            <span className="mt-0.5 text-xs text-ink-400">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Patient queue (En_Atencion) ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-200">Cola de atención</h2>
        {enAtencion.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Stethoscope}
                title="Sin pacientes en atención"
                description="Cuando recepción registre el ingreso de una cita, aparecerá aquí."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {enAtencion.map((c, i) => {
              const timeStr = c.fechaHora
                ? new Date(c.fechaHora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <motion.div
                  key={c.idCita}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Clock className="h-4 w-4" />
                    <span className="mt-0.5 text-sm font-bold leading-none">{timeStr}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-100">{c.pacienteNombre ?? c.idPaciente}</p>
                    <p className="truncate text-xs text-ink-500">{c.especialidad}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate('/medico/atencion')}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Atender
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming (Pendiente) ── */}
      {pendientes.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-200">Próximas citas</h2>
          <Card>
            <ul className="divide-y divide-white/[0.04]">
              {pendientes.slice(0, 4).map((c) => (
                <li key={c.idCita} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-100">{c.pacienteNombre ?? c.idPaciente}</p>
                    <p className="truncate text-xs text-ink-500">
                      {c.especialidad} · {fmtDateTime(c.fechaHora)}
                    </p>
                  </div>
                  <EstadoCitaBadge estado={c.estado} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ── Navigation tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {navLinks.map((a, i) => (
          <motion.button
            key={a.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ y: -2, scale: 1.02 }}
            onClick={() => navigate(a.to)}
            className="glass flex flex-col items-center gap-3 rounded-2xl p-5 text-center shadow-card transition-all hover:bg-white/[0.05]"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.cls}`}>
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium leading-tight text-ink-100">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
