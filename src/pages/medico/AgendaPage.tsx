import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CalendarX, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { useMedicos } from '@/hooks/useMedicos';
import { medicosApi } from '@/api/medicos.api';
import { apiError } from '@/api/http';
import { fmtDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import type { HorarioBase } from '@/types';

const DIAS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
  { n: 6, label: 'Sábado' },
  { n: 0, label: 'Domingo' },
];

interface DiaRow {
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
  duracion_cita_min: number;
}

const initRows = (): Record<number, DiaRow> =>
  Object.fromEntries(
    DIAS.map((d) => [d.n, { activo: d.n >= 1 && d.n <= 5, hora_inicio: '08:00', hora_fin: '13:00', duracion_cita_min: 30 }]),
  );

export default function AgendaPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const idMedico = user?.idMedico ?? '';
  const { data: medicos } = useMedicos();
  const miMedico = medicos?.find((m) => m.id_medico === idMedico);
  const [rows, setRows] = useState<Record<number, DiaRow>>(initRows());

  const [bInicio, setBInicio] = useState('');
  const [bFin, setBFin] = useState('');
  const [bMotivo, setBMotivo] = useState('');

  const disp = useQuery({
    queryKey: ['disponibilidad', idMedico],
    queryFn: () => medicosApi.disponibilidad(idMedico) as Promise<{ horarios?: unknown[]; bloqueos?: { motivo?: string; fecha_inicio?: string; fecha_fin?: string }[] }>,
    enabled: !!idMedico,
  });

  const guardarHorarios = useMutation({
    mutationFn: () => {
      const horarios: HorarioBase[] = DIAS.filter((d) => rows[d.n].activo).map((d) => ({
        dia_semana: d.n,
        hora_inicio: rows[d.n].hora_inicio,
        hora_fin: rows[d.n].hora_fin,
        duracion_cita_min: Number(rows[d.n].duracion_cita_min) || 30,
      }));
      return medicosApi.registrarHorarios(idMedico, horarios);
    },
    onSuccess: () => {
      toast.success('Horario semanal guardado');
      qc.invalidateQueries({ queryKey: ['disponibilidad', idMedico] });
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const guardarBloqueo = useMutation({
    mutationFn: () =>
      medicosApi.registrarBloqueo(idMedico, { fecha_inicio: bInicio, fecha_fin: bFin, motivo: bMotivo }),
    onSuccess: () => {
      toast.success('Bloqueo registrado');
      setBInicio('');
      setBFin('');
      setBMotivo('');
      qc.invalidateQueries({ queryKey: ['disponibilidad', idMedico] });
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const setRow = (n: number, patch: Partial<DiaRow>) =>
    setRows((r) => ({ ...r, [n]: { ...r[n], ...patch } }));

  return (
    <div>
      <PageHeader title="Mi agenda" subtitle="Configura tu horario semanal y bloqueos" />

      {!idMedico ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={CalendarClock}
              title="Cuenta sin médico vinculado"
              description="Tu usuario no está enlazado a un registro de médico. Pídele a un auditor que cree tu perfil de médico."
            />
          </CardBody>
        </Card>
      ) : (
        <>
        {miMedico && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-semibold text-white">
              {miMedico.nombre[0]}{miMedico.apellido[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-100">Dr(a). {miMedico.nombre} {miMedico.apellido}</p>
              <p className="text-xs text-ink-400">{miMedico.especialidad} · CMP {miMedico.cmp}</p>
            </div>
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Horario semanal */}
          <Card className="lg:col-span-3">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
              <Clock className="h-4 w-4 text-ok" />
              <h3 className="text-sm font-semibold text-ink-100">Horario semanal</h3>
            </div>
            <CardBody className="space-y-2">
              {DIAS.map((d) => {
                const row = rows[d.n];
                return (
                  <div key={d.n} className={`flex flex-wrap items-center gap-2 rounded-xl border p-2.5 ${row.activo ? 'border-ok/20 bg-ok/[0.04]' : 'border-white/[0.05] bg-white/[0.01]'}`}>
                    <label className="flex w-28 items-center gap-2">
                      <input type="checkbox" checked={row.activo} onChange={(e) => setRow(d.n, { activo: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                      <span className="text-sm text-ink-200">{d.label}</span>
                    </label>
                    <input type="time" disabled={!row.activo} value={row.hora_inicio} onChange={(e) => setRow(d.n, { hora_inicio: e.target.value })} className="h-9 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40" />
                    <span className="text-ink-500">—</span>
                    <input type="time" disabled={!row.activo} value={row.hora_fin} onChange={(e) => setRow(d.n, { hora_fin: e.target.value })} className="h-9 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40" />
                    <div className="flex items-center gap-1.5">
                      <input type="number" min={10} step={5} disabled={!row.activo} value={row.duracion_cita_min} onChange={(e) => setRow(d.n, { duracion_cita_min: Number(e.target.value) })} className="h-9 w-16 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40" />
                      <span className="text-xs text-ink-500">min</span>
                    </div>
                  </div>
                );
              })}
              <Button className="mt-2 w-full" leftIcon={<Save className="h-4 w-4" />} loading={guardarHorarios.isPending} onClick={() => guardarHorarios.mutate()}>
                Guardar horario
              </Button>
            </CardBody>
          </Card>

          {/* Bloqueos */}
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
              <CalendarX className="h-4 w-4 text-rose-300" />
              <h3 className="text-sm font-semibold text-ink-100">Bloqueos</h3>
            </div>
            <CardBody className="space-y-3">
              <Input label="Desde" type="datetime-local" value={bInicio} onChange={(e) => setBInicio(e.target.value)} />
              <Input label="Hasta" type="datetime-local" value={bFin} onChange={(e) => setBFin(e.target.value)} />
              <Input label="Motivo" value={bMotivo} onChange={(e) => setBMotivo(e.target.value)} placeholder="Ej. Congreso médico" />
              <Button variant="secondary" className="w-full" disabled={!bInicio || !bFin || !bMotivo} loading={guardarBloqueo.isPending} onClick={() => guardarBloqueo.mutate()}>
                Registrar bloqueo
              </Button>

              <div className="border-t border-white/[0.06] pt-3">
                <p className="mb-2 text-xs text-ink-500">Bloqueos vigentes</p>
                {disp.data?.bloqueos?.length ? (
                  <ul className="space-y-2">
                    {disp.data.bloqueos.map((b, i) => (
                      <li key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-xs">
                        <p className="text-ink-200">{b.motivo}</p>
                        <p className="text-ink-500">{fmtDateTime(b.fecha_inicio)} → {fmtDateTime(b.fecha_fin)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink-500">Sin bloqueos registrados.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
