import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, FileHeart, Pill, Stethoscope, Activity, Users } from 'lucide-react';
import { Card, StatCard, EmptyState } from '@/components/ui';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import { fmtDateTime } from '@/lib/format';

const actions = [
  { label: 'Nueva atención', icon: Stethoscope, to: '/medico/atencion' },
  { label: 'Mi agenda', icon: CalendarClock, to: '/medico/agenda' },
  { label: 'Historia clínica', icon: FileHeart, to: '/medico/historias' },
  { label: 'Mis recetas', icon: Pill, to: '/medico/recetas' },
];

export default function DashboardMedicoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { citas, recetas } = useActivityStore();
  const enAtencion = citas.filter((c) => c.estado === 'En_Atencion');
  const firstName = user?.nombre?.split(' ').slice(-1)[0] ?? '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-100">Dr(a). {firstName} 🩺</h1>
        <p className="mt-1 text-sm text-ink-400">Tu jornada clínica de hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="En atención" value={enAtencion.length} icon={Activity} tone="info" index={0} />
        <StatCard label="Citas registradas" value={citas.length} icon={Users} tone="brand" index={1} />
        <StatCard label="Recetas emitidas" value={recetas.length} icon={Pill} tone="success" index={2} />
        <StatCard label="Atenciones hoy" value={enAtencion.length} icon={Stethoscope} tone="warning" index={3} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((a, i) => (
          <motion.button
            key={a.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            whileHover={{ y: -3 }}
            onClick={() => navigate(a.to)}
            className="glass flex items-center gap-3 rounded-2xl p-4 text-left shadow-card transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-glow-sm">
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-ink-100">{a.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Cola de atención</h3>
          </div>
          {enAtencion.length === 0 ? (
            <EmptyState icon={Stethoscope} title="Sin pacientes en atención" description="Cuando recepción registre el ingreso de una cita, aparecerá aquí." />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {enAtencion.map((c) => (
                <li key={c.idCita} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">{c.pacienteNombre ?? c.idPaciente}</p>
                    <p className="truncate text-xs text-ink-500">{c.especialidad} · {fmtDateTime(c.fechaHora)}</p>
                  </div>
                  <button
                    onClick={() => navigate('/medico/atencion')}
                    className="rounded-lg bg-ok/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-ok/25"
                  >
                    Atender
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
