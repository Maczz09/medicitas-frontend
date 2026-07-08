import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CalendarX, ChevronLeft, ChevronRight, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { useMedicos } from '@/hooks/useMedicos';
import { medicosApi } from '@/api/medicos.api';
import { apiError } from '@/api/http';
import { fmtDateTime } from '@/lib/format';
import { hoyISO } from '@/lib/slots';
import { lunesDeLaSemana, sumarDias, formatoRangoSemana } from '@/lib/semana';
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

const initRows = (activoPorDefecto = false): Record<number, DiaRow> =>
  Object.fromEntries(
    DIAS.map((d) => [
      d.n,
      { activo: activoPorDefecto && d.n >= 1 && d.n <= 5, hora_inicio: '08:00', hora_fin: '13:00', duracion_cita_min: 30 },
    ]),
  );

/** Fila de un día — igual forma para la plantilla y para una semana específica. */
function DiaRowEditor({
  dia,
  row,
  onChange,
}: {
  dia: { n: number; label: string };
  row: DiaRow;
  onChange: (patch: Partial<DiaRow>) => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border p-2.5 ${
        row.activo ? 'border-ok/20 bg-ok/[0.04]' : 'border-white/[0.05] bg-white/[0.01]'
      }`}
    >
      <label className="flex w-28 items-center gap-2">
        <input
          type="checkbox"
          checked={row.activo}
          onChange={(e) => onChange({ activo: e.target.checked })}
          className="h-4 w-4 accent-emerald-500"
        />
        <span className="text-sm text-ink-200">{dia.label}</span>
      </label>
      <input
        type="time"
        disabled={!row.activo}
        value={row.hora_inicio}
        onChange={(e) => onChange({ hora_inicio: e.target.value })}
        className="h-9 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40"
      />
      <span className="text-ink-500">—</span>
      <input
        type="time"
        disabled={!row.activo}
        value={row.hora_fin}
        onChange={(e) => onChange({ hora_fin: e.target.value })}
        className="h-9 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40"
      />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={10}
          step={5}
          disabled={!row.activo}
          value={row.duracion_cita_min}
          onChange={(e) => onChange({ duracion_cita_min: Number(e.target.value) })}
          className="h-9 w-16 rounded-lg border border-white/10 bg-navy-900/60 px-2 text-sm text-ink-100 disabled:opacity-40"
        />
        <span className="text-xs text-ink-500">min</span>
      </div>
    </div>
  );
}

function filasActivasAHorarioBase(rows: Record<number, DiaRow>): HorarioBase[] {
  return DIAS.filter((d) => rows[d.n].activo).map((d) => ({
    dia_semana: d.n,
    hora_inicio: rows[d.n].hora_inicio,
    hora_fin: rows[d.n].hora_fin,
    duracion_cita_min: Number(rows[d.n].duracion_cita_min) || 30,
  }));
}

export default function AgendaPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const idMedico = user?.idMedico ?? '';
  const { data: medicos } = useMedicos();
  const miMedico = medicos?.find((m) => m.id_medico === idMedico);

  // ── Plantilla base (respaldo) ─────────────────────────────────────────────
  const [rows, setRows] = useState<Record<number, DiaRow>>(initRows(true));

  const disp = useQuery({
    queryKey: ['disponibilidad', idMedico],
    queryFn: () =>
      medicosApi.disponibilidad(idMedico) as Promise<{
        horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string; duracion_cita_min: number }[];
        bloqueos?: { motivo?: string; fecha_inicio?: string; fecha_fin?: string }[];
      }>,
    enabled: !!idMedico,
  });

  // El formulario arranca con un default fijo (initRows()) solo para no
  // mostrarse vacío mientras carga — apenas llega el horario real guardado,
  // se hidrata UNA VEZ desde el servidor. El guard `hidratado` evita que un
  // refetch posterior (foco de ventana, u otra invalidación) pise ediciones
  // que el médico ya esté haciendo a mitad de camino; tras un guardado
  // exitoso `rows` ya refleja lo recién guardado, así que no hace falta
  // volver a hidratar.
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    if (hidratado || !disp.data) return;
    const horarios = disp.data.horarios ?? [];
    setRows((prev) => {
      const next = { ...prev };
      for (const d of DIAS) next[d.n] = { ...next[d.n], activo: false };
      for (const h of horarios) {
        next[h.dia_semana] = {
          activo: true,
          hora_inicio: h.hora_inicio?.slice(0, 5) || '08:00',
          hora_fin: h.hora_fin?.slice(0, 5) || '13:00',
          duracion_cita_min: h.duracion_cita_min ?? 30,
        };
      }
      return next;
    });
    setHidratado(true);
  }, [disp.data, hidratado]);

  const guardarHorarios = useMutation({
    mutationFn: () => medicosApi.registrarHorarios(idMedico, filasActivasAHorarioBase(rows)),
    onSuccess: () => {
      toast.success('Plantilla base guardada');
      qc.invalidateQueries({ queryKey: ['disponibilidad', idMedico] });
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const setRow = (n: number, patch: Partial<DiaRow>) => setRows((r) => ({ ...r, [n]: { ...r[n], ...patch } }));

  // ── Semana específica ─────────────────────────────────────────────────────
  const [semanaInicio, setSemanaInicio] = useState(() => lunesDeLaSemana(hoyISO()));
  const [semanaRows, setSemanaRows] = useState<Record<number, DiaRow>>(initRows());
  const [semanaOrigen, setSemanaOrigen] = useState<'PLANTILLA' | 'SEMANA' | null>(null);
  const [semanaHidratadaPara, setSemanaHidratadaPara] = useState<string | null>(null);

  const semanaQuery = useQuery({
    queryKey: ['horario-semana', idMedico, semanaInicio],
    queryFn: () => medicosApi.consultarHorarioSemana(idMedico, semanaInicio),
    enabled: !!idMedico,
  });

  // Re-hidrata cada vez que semanaInicio cambia (navegar de semana), pero no
  // en cada refetch de la MISMA semana — mismo criterio que la plantilla de
  // arriba, aplicado por semana en vez de una sola vez por sesión.
  useEffect(() => {
    if (!semanaQuery.data || semanaHidratadaPara === semanaInicio) return;
    const next = initRows();
    for (const dia of semanaQuery.data.dias) {
      next[dia.dia_semana] = {
        activo: dia.activo,
        hora_inicio: dia.hora_inicio.slice(0, 5),
        hora_fin: dia.hora_fin.slice(0, 5),
        duracion_cita_min: dia.duracion_cita_min,
      };
    }
    setSemanaRows(next);
    setSemanaOrigen(semanaQuery.data.origen);
    setSemanaHidratadaPara(semanaInicio);
  }, [semanaQuery.data, semanaInicio, semanaHidratadaPara]);

  const guardarSemana = useMutation({
    mutationFn: () => medicosApi.definirHorarioSemana(idMedico, semanaInicio, filasActivasAHorarioBase(semanaRows)),
    onSuccess: () => {
      toast.success('Horario de la semana guardado');
      setSemanaOrigen('SEMANA'); // ya no es fallback — refleja el guardado sin esperar el refetch
      qc.invalidateQueries({ queryKey: ['horario-semana', idMedico, semanaInicio] });
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const setSemanaRow = (n: number, patch: Partial<DiaRow>) =>
    setSemanaRows((r) => ({ ...r, [n]: { ...r[n], ...patch } }));

  const irSemana = (delta: number) => setSemanaInicio((s) => sumarDias(s, delta * 7));
  const irSemanaActual = () => setSemanaInicio(lunesDeLaSemana(hoyISO()));

  // ── Bloqueos ───────────────────────────────────────────────────────────────
  const [bInicio, setBInicio] = useState('');
  const [bFin, setBFin] = useState('');
  const [bMotivo, setBMotivo] = useState('');

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
                {miMedico.nombre[0]}
                {miMedico.apellido[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-100">
                  Dr(a). {miMedico.nombre} {miMedico.apellido}
                </p>
                <p className="text-xs text-ink-400">
                  {miMedico.especialidad} · CMP {miMedico.cmp}
                </p>
              </div>
            </div>
          )}

          {/* Semana específica */}
          <Card className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-brand-300" />
                <h3 className="text-sm font-semibold text-ink-100">Semana específica</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => irSemana(-1)}
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={irSemanaActual} className="text-sm font-medium text-ink-100 hover:text-brand-300">
                  Semana del {formatoRangoSemana(semanaInicio)}
                </button>
                <button
                  onClick={() => irSemana(1)}
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                  aria-label="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span
                  className={`ml-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                    semanaOrigen === 'SEMANA'
                      ? 'bg-brand-500/15 text-brand-300 ring-brand-500/25'
                      : 'bg-white/[0.06] text-ink-400 ring-white/10'
                  }`}
                >
                  {semanaOrigen === 'SEMANA' ? 'Personalizada' : 'Usando plantilla base'}
                </span>
              </div>
            </div>
            <CardBody className="space-y-2">
              {DIAS.map((d) => (
                <DiaRowEditor key={d.n} dia={d} row={semanaRows[d.n]} onChange={(patch) => setSemanaRow(d.n, patch)} />
              ))}
              <p className="pt-1 text-xs text-ink-500">
                {semanaOrigen === 'SEMANA'
                  ? 'Esta semana tiene un horario propio — ya no usa la plantilla base para ningún día, ni siquiera los que dejaste sin marcar.'
                  : 'Estás viendo la plantilla base como punto de partida. Al guardar, esta semana queda fija con exactamente lo que se ve aquí.'}
              </p>
              <Button
                className="mt-2 w-full"
                leftIcon={<Save className="h-4 w-4" />}
                loading={guardarSemana.isPending}
                onClick={() => guardarSemana.mutate()}
              >
                Guardar esta semana
              </Button>
            </CardBody>
          </Card>

          <div className="grid gap-5 lg:grid-cols-5">
            {/* Plantilla base */}
            <Card className="lg:col-span-3">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
                <Clock className="h-4 w-4 text-ok" />
                <h3 className="text-sm font-semibold text-ink-100">Plantilla base</h3>
              </div>
              <CardBody className="space-y-2">
                <p className="text-xs text-ink-500">
                  Se usa como respaldo en cualquier semana que no hayas personalizado arriba.
                </p>
                {DIAS.map((d) => (
                  <DiaRowEditor key={d.n} dia={d} row={rows[d.n]} onChange={(patch) => setRow(d.n, patch)} />
                ))}
                <Button
                  className="mt-2 w-full"
                  leftIcon={<Save className="h-4 w-4" />}
                  loading={guardarHorarios.isPending}
                  onClick={() => guardarHorarios.mutate()}
                >
                  Guardar plantilla
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
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!bInicio || !bFin || !bMotivo}
                  loading={guardarBloqueo.isPending}
                  onClick={() => guardarBloqueo.mutate()}
                >
                  Registrar bloqueo
                </Button>

                <div className="border-t border-white/[0.06] pt-3">
                  <p className="mb-2 text-xs text-ink-500">Bloqueos vigentes</p>
                  {disp.data?.bloqueos?.length ? (
                    <ul className="space-y-2">
                      {disp.data.bloqueos.map((b, i) => (
                        <li key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-xs">
                          <p className="text-ink-200">{b.motivo}</p>
                          <p className="text-ink-500">
                            {fmtDateTime(b.fecha_inicio)} → {fmtDateTime(b.fecha_fin)}
                          </p>
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
