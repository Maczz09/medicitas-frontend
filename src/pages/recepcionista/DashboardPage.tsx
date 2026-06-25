import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarPlus,
  CreditCard,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
  CalendarDays,
} from 'lucide-react';
import { Card, StatCard, EmptyState, Button } from '@/components/ui';
import { EstadoCitaBadge, EstadoCoberturaBadge } from '@/components/domain/StatusBadge';
import { usePacientesList } from '@/features/pacientes/usePacientes';
import { useMedicos } from '@/hooks/useMedicos';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import { fmtDateTime, fmtMoney } from '@/lib/format';

const quickActions = [
  { label: 'Nuevo paciente', icon: UserPlus, to: '/recepcion/pacientes' },
  { label: 'Agendar cita', icon: CalendarPlus, to: '/recepcion/citas' },
  { label: 'Validar cobertura', icon: ShieldCheck, to: '/recepcion/cobertura' },
  { label: 'Registrar pago', icon: CreditCard, to: '/recepcion/pagos' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: pacientes } = usePacientesList({ page: 1, limit: 1 });
  const { data: medicos } = useMedicos();
  const { citas, coberturas } = useActivityStore();

  const firstName = user?.nombre?.split(' ')[0] ?? '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-100">
          Hola, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-400">Este es el resumen de la recepción hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pacientes" value={pacientes?.meta.total ?? '—'} icon={Users} tone="brand" index={0} />
        <StatCard label="Médicos activos" value={medicos?.length ?? '—'} icon={Stethoscope} tone="success" index={1} />
        <StatCard label="Citas recientes" value={citas.length} icon={CalendarDays} tone="info" index={2} />
        <StatCard label="Coberturas" value={coberturas.length} icon={ShieldCheck} tone="warning" index={3} />
      </div>

      {/* Acciones rápidas */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileHover={{ y: -3 }}
            onClick={() => navigate(a.to)}
            className="glass flex items-center gap-3 rounded-2xl p-4 text-left shadow-card transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-ink-100">{a.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Citas recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/recepcion/citas')}>
              Ver todas
            </Button>
          </div>
          {citas.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sin citas aún" description="Las citas que agendes aparecerán aquí." />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {citas.slice(0, 5).map((c) => (
                <li key={c.idCita} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">
                      {c.pacienteNombre ?? c.idPaciente}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {c.especialidad} · {fmtDateTime(c.fechaHora)}
                    </p>
                  </div>
                  <EstadoCitaBadge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Coberturas validadas</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/recepcion/cobertura')}>
              Ver todas
            </Button>
          </div>
          {coberturas.length === 0 ? (
            <EmptyState icon={Pill} title="Sin validaciones" description="Las validaciones de seguro aparecerán aquí." />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {coberturas.slice(0, 5).map((c) => (
                <li key={c.idValidacion} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">
                      {c.pacienteNombre ?? c.idPaciente}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {c.porcentajeCobertura}% cobertura · {fmtMoney(0)}
                    </p>
                  </div>
                  <EstadoCoberturaBadge estado={c.estadoCobertura} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
