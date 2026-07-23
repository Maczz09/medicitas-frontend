import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, CalendarCheck, LogIn, XCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Card, EmptyState, PageHeader, Pagination, SkeletonRows, Tooltip } from '@/components/ui';
import { EstadoCitaBadge } from '@/components/domain/StatusBadge';
import { ListToolbar } from '@/components/domain/ListToolbar';
import { citasApi } from '@/api/citas.api';
import { apiError } from '@/api/http';
import { fmtDateTime } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import type { EstadoCita, Paciente } from '@/types';

const ESTADOS: (EstadoCita | '')[] = ['', 'Pendiente', 'En_Atencion', 'Completada', 'Cancelada', 'No_Asistida'];
const ESTADO_OPTIONS = ESTADOS.map((e) => ({ value: e, label: e === '' ? 'Todos los estados' : e.replace('_', ' ') }));

export default function AdminCitasPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.citas.admin(page, estado, debouncedSearch, paciente?.id_paciente),
    // A diferencia de Recepción/Médico, Auditoría sí necesita ver las citas
    // de pacientes desactivados (soft-delete) para trazabilidad completa.
    queryFn: () => citasApi.list({
      page, limit: 10, estado: estado || undefined, incluirInactivos: true,
      q: debouncedSearch || undefined, idPaciente: paciente?.id_paciente,
    }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.citas.all });

  const ingreso = useMutation({
    mutationFn: (id: string) => citasApi.registrarIngreso(id),
    onSuccess: () => { toast.success('Ingreso registrado'); refresh(); },
    onError: (err) => toast.error(apiError(err)),
  });
  const completar = useMutation({
    mutationFn: (id: string) => citasApi.completar(id),
    onSuccess: () => { toast.success('Cita completada'); refresh(); },
    onError: (err) => toast.error(apiError(err)),
  });
  const cancelar = useMutation({
    mutationFn: (id: string) => citasApi.cancelar(id, 'Cancelada por auditoría'),
    onSuccess: () => { toast.success('Cita cancelada'); refresh(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const citas = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Citas" subtitle="Todas las citas del sistema y su gestión" />

      <Card className="overflow-hidden">
        <ListToolbar
          search={{
            value: search,
            onChange: (v) => { setSearch(v); setPage(1); },
            placeholder: 'Buscar por especialidad…',
          }}
          estado={{
            value: estado,
            onChange: (v) => { setEstado(v); setPage(1); },
            options: ESTADO_OPTIONS,
          }}
          paciente={{
            value: paciente,
            onChange: (p) => { setPaciente(p); setPage(1); },
          }}
        />

        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={6} /></div>
        ) : citas.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin citas" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Médico</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Correlación</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.paciente_nombre ?? c.id_paciente} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-100">{c.paciente_nombre ?? c.id_paciente}</p>
                            <p className="truncate text-xs text-ink-500">{c.especialidad}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3 text-ink-300 lg:table-cell">{c.medico_nombre ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-300">{fmtDateTime(c.fecha_hora)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <EstadoCitaBadge estado={c.estado} />
                          {c.estado === 'En_Atencion' && c.pago_verificado === 0 && (
                            <Tooltip content="Ingreso registrado con Pagos no disponible — el pago aún no se verificó contra el registro real. Se confirma solo en cuanto Pagos se recupere.">
                              <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-500 xl:table-cell">{c.correlation_id?.slice(0, 10) ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.estado === 'Pendiente' && (
                            <Tooltip content="Registrar ingreso">
                              <button onClick={() => ingreso.mutate(c.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-emerald-300"><LogIn className="h-4 w-4" /></button>
                            </Tooltip>
                          )}
                          {c.estado === 'En_Atencion' && (
                            <Tooltip content="Completar cita">
                              <button onClick={() => completar.mutate(c.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-emerald-300"><CalendarCheck className="h-4 w-4" /></button>
                            </Tooltip>
                          )}
                          {(c.estado === 'Pendiente' || c.estado === 'En_Atencion') && (
                            <Tooltip content="Cancelar">
                              <button onClick={() => cancelar.mutate(c.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-rose-300"><XCircle className="h-4 w-4" /></button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="citas" />
          </>
        )}
      </Card>
    </div>
  );
}
