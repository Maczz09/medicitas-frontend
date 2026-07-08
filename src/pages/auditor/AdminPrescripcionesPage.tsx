import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCheck, ChevronLeft, ChevronRight, Eye, FileWarning, Pill, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Card, EmptyState, PageHeader, Select, SkeletonRows, Tooltip } from '@/components/ui';
import { EstadoRecetaBadge, ContingenciaBadge } from '@/components/domain/StatusBadge';
import { RecetaDetalleModal } from '@/components/domain/RecetaDetalleModal';
import { prescripcionesApi } from '@/api/prescripciones.api';
import { apiError } from '@/api/http';
import type { DespachoAdmin, EstadoReceta } from '@/types';

const ESTADOS = ['', 'CREADA', 'ENVIADA_A_FARMACIA', 'DESPACHADA', 'RECHAZADA_POR_STOCK', 'RECHAZADA_POR_VALIDACION', 'RETIRADA'];

function medicamento(d: DespachoAdmin): string {
  try {
    const c = typeof d.contenido === 'string' ? JSON.parse(d.contenido) : d.contenido;
    return c?.medicamento ?? '—';
  } catch {
    return '—';
  }
}

export default function AdminPrescripcionesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');
  const [soloContingencia, setSoloContingencia] = useState(false);
  const [idDetalle, setIdDetalle] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-prescripciones', page, estado, soloContingencia],
    queryFn: () => prescripcionesApi.list({ page, limit: 10, estado: estado || undefined, contingencia: soloContingencia || undefined }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-prescripciones'] });

  const reintentar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.reintentar(id, crypto.randomUUID()),
    onSuccess: () => { toast.success('Reintento iniciado'); refresh(); },
    onError: (err) => toast.error(apiError(err)),
  });
  const retirar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.marcarRetirada(id, crypto.randomUUID()),
    onSuccess: () => { toast.success('Retiro registrado'); refresh(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Prescripciones" subtitle="Despachos de receta a farmacia: estado, correlación y gestión" />
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
          <Button
            size="sm"
            variant={soloContingencia ? 'outline' : 'ghost'}
            leftIcon={<FileWarning className="h-3.5 w-3.5" />}
            onClick={() => { setSoloContingencia((v) => !v); setPage(1); }}
          >
            Contingencia
          </Button>
          <div className="max-w-xs">
            <Select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e === '' ? 'Todos los estados' : e.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
        </div>
        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Pill} title="Sin despachos" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="hidden px-5 py-3 font-medium md:table-cell">ID</th>
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Medicamento</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Ref. farmacia</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Correlación</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-500 md:table-cell">{d.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={d.paciente_nombre ?? d.id_paciente} size="sm" />
                          <span className="truncate font-medium text-ink-100">{d.paciente_nombre ?? d.id_paciente}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-200">{medicamento(d)}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <EstadoRecetaBadge estado={d.estado as EstadoReceta} />
                          {d.contingencia_url_descarga && (
                            <ContingenciaBadge urlDescarga={d.contingencia_url_descarga} esContingencia={!!d.es_contingencia} />
                          )}
                        </div>
                        {d.motivo_rechazo && <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-rose-300/70">{d.motivo_rechazo}</p>}
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-400 lg:table-cell">{d.referencia_farmacia ?? '—'}</td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-500 xl:table-cell">{d.correlation_id?.slice(0, 10) ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Ver detalle completo">
                            <button onClick={() => setIdDetalle(d.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-ink-100"><Eye className="h-4 w-4" /></button>
                          </Tooltip>
                          {(d.estado === 'RECHAZADA_POR_VALIDACION' || d.estado === 'RECHAZADA_POR_STOCK') && (
                            <Tooltip content="Reintentar envío">
                              <button onClick={() => reintentar.mutate(d.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-brand-300"><RefreshCw className="h-4 w-4" /></button>
                            </Tooltip>
                          )}
                          {d.estado === 'DESPACHADA' && (
                            <Tooltip content="Marcar retirada">
                              <button onClick={() => retirar.mutate(d.id)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-emerald-300"><CheckCheck className="h-4 w-4" /></button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-xs text-ink-400">{meta.total} despachos · página {meta.page} de {meta.totalPages || 1}</p>
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>Anterior</Button>
                  <Button variant="secondary" size="sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>Siguiente</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <RecetaDetalleModal idReceta={idDetalle} open={!!idDetalle} onOpenChange={(o) => !o && setIdDetalle(null)} />
    </div>
  );
}
