import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ScrollText, Stethoscope, Users } from 'lucide-react';
import { Card, CardBody, StatCard, EmptyState } from '@/components/ui';
import { auditoriaApi } from '@/api/auditoria.api';
import { usePacientesList } from '@/features/pacientes/usePacientes';
import { useMedicos } from '@/hooks/useMedicos';
import { useAuthStore } from '@/store/auth.store';

const COLORS = ['#3b82f6', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function DashboardAuditorPage() {
  const user = useAuthStore((s) => s.user);
  const { data: pacientes } = usePacientesList({ page: 1, limit: 1 });
  const { data: medicos } = useMedicos();
  const { data: trazas } = useQuery({
    queryKey: ['trazas', 'dashboard'],
    queryFn: () => auditoriaApi.trazas({ porPagina: 100 }),
  });

  const porServicio = useMemo(() => {
    const map = new Map<string, number>();
    (trazas?.trazas ?? []).forEach((t) => map.set(t.servicioOrigen, (map.get(t.servicioOrigen) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [trazas]);

  const porEvento = useMemo(() => {
    const map = new Map<string, number>();
    (trazas?.trazas ?? []).forEach((t) => map.set(t.tipoEvento, (map.get(t.tipoEvento) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [trazas]);

  const firstName = user?.nombre?.split(' ')[0] ?? '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-100">Hola, {firstName} 📊</h1>
        <p className="mt-1 text-sm text-ink-400">Visión global del sistema y su actividad.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pacientes" value={pacientes?.meta.total ?? '—'} icon={Users} tone="brand" index={0} />
        <StatCard label="Médicos" value={medicos?.length ?? '—'} icon={Stethoscope} tone="success" index={1} />
        <StatCard label="Eventos auditados" value={trazas?.total ?? '—'} icon={ScrollText} tone="warning" index={2} />
        <StatCard label="Servicios activos" value={porServicio.length} icon={Activity} tone="info" index={3} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Eventos por servicio</h3>
          </div>
          <CardBody>
            {porServicio.length === 0 ? (
              <EmptyState icon={ScrollText} title="Sin datos" description="Aún no hay eventos auditados." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porServicio} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#eaf0fb' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {porServicio.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Tipos de evento</h3>
          </div>
          <CardBody>
            {porEvento.length === 0 ? (
              <EmptyState icon={ScrollText} title="Sin datos" description="Aún no hay eventos auditados." />
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={porEvento} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3}>
                      {porEvento.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#eaf0fb' }} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 space-y-1.5">
                  {porEvento.map((e, i) => (
                    <li key={e.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate text-ink-300">{e.name}</span>
                      <span className="font-semibold text-ink-100">{e.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
