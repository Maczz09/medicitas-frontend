import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCheck, ChevronLeft, ChevronRight, Eye, FileWarning, Pill, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Card, CardBody, EmptyState, Input, PageHeader, Select, SkeletonRows, Tooltip } from '@/components/ui';
import { EstadoRecetaBadge, ContingenciaBadge } from '@/components/domain/StatusBadge';
import { RecetaDetalleModal } from '@/components/domain/RecetaDetalleModal';
import { prescripcionesApi } from '@/api/prescripciones.api';
import { apiError } from '@/api/http';
import { useAuthStore } from '@/store/auth.store';
import type { DespachoAdmin, EstadoReceta, Receta } from '@/types';

const ESTADOS = ['', 'CREADA', 'ENVIADA_A_FARMACIA', 'DESPACHADA', 'RECHAZADA_POR_STOCK', 'RECHAZADA_POR_VALIDACION', 'RETIRADA'];

function medicamento(d: DespachoAdmin): string {
  try {
    const c = typeof d.contenido === 'string' ? JSON.parse(d.contenido) : d.contenido;
    return c?.medicamento ?? '—';
  } catch {
    return '—';
  }
}

export default function RecetasPage() {
  const qc = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  // "Marcar retirada" es exclusivo de Recepcionista/Auditor en el backend
  // (el médico no entrega el medicamento físico) — se oculta para Médico.
  const puedeMarcarRetirada = rol !== 'Médico';

  const [idReceta, setIdReceta] = useState('');
  const [current, setCurrent] = useState<Receta | null>(null);

  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');
  const [soloContingencia, setSoloContingencia] = useState(false);
  const [idDetalle, setIdDetalle] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['prescripciones-lista', page, estado, soloContingencia],
    queryFn: () => prescripcionesApi.list({ page, limit: 8, estado: estado || undefined, contingencia: soloContingencia || undefined }),
    placeholderData: keepPreviousData,
  });
  const items = data?.data ?? [];
  const meta = data?.meta;
  const refreshLista = () => qc.invalidateQueries({ queryKey: ['prescripciones-lista'] });

  const buscar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.getById(id),
    onSuccess: (r) => setCurrent(r),
    onError: (err) => toast.error(apiError(err, 'Receta no encontrada')),
  });

  const reintentar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.reintentar(id, crypto.randomUUID()),
    onSuccess: (r) => {
      setCurrent((c) => (c ? { ...c, estado: r.estado ?? c.estado } : c));
      toast.success('Reintento de envío iniciado');
      refreshLista();
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const retirar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.marcarRetirada(id, crypto.randomUUID()),
    onSuccess: (r) => {
      setCurrent((c) => (c ? { ...c, estado: 'RETIRADA' as EstadoReceta } : c));
      toast.success('Retiro registrado');
      refreshLista();
      void r;
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const seleccionar = (id: string) => {
    setIdReceta(id);
    buscar.mutate(id);
  };

  return (
    <div>
      <PageHeader title="Recetas" subtitle="Consulta y gestiona los despachos de receta a farmacia" />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Izquierda: búsqueda directa + detalle/acciones de la receta seleccionada ── */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <Search className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Buscar por ID</h3>
          </div>
          <CardBody className="space-y-4">
            <Input
              label="ID de la receta"
              value={idReceta}
              onChange={(e) => setIdReceta(e.target.value)}
              placeholder="REC-XXXXXX"
              hint="O selecciona una receta de la lista de la derecha"
              onKeyDown={(e) => e.key === 'Enter' && idReceta && buscar.mutate(idReceta)}
            />
            <Button className="w-full" disabled={!idReceta} loading={buscar.isPending} onClick={() => buscar.mutate(idReceta)}>
              Consultar estado
            </Button>

            {current && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-400">{current.id}</span>
                  <EstadoRecetaBadge estado={current.estado} />
                </div>
                {current.contenido?.medicamento && (
                  <p className="mt-2 text-sm font-medium text-ink-100">{current.contenido.medicamento}</p>
                )}
                {current.contenido?.dosis && (
                  <p className="mt-0.5 text-xs text-ink-500">{current.contenido.dosis} · {current.contenido.cantidad} uds.</p>
                )}
                {current.motivoRechazo && (
                  <p className="mt-1 text-xs text-rose-300/80">{current.motivoRechazo}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(current.estado === 'RECHAZADA_POR_VALIDACION' || current.estado === 'RECHAZADA_POR_STOCK') && (
                    <Button size="sm" variant="secondary" loading={reintentar.isPending} leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => reintentar.mutate(current.id)}>
                      Reintentar envío
                    </Button>
                  )}
                  {puedeMarcarRetirada && current.estado === 'DESPACHADA' && (
                    <Button size="sm" variant="success" loading={retirar.isPending} leftIcon={<CheckCheck className="h-3.5 w-3.5" />} onClick={() => retirar.mutate(current.id)}>
                      Marcar retirada
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => buscar.mutate(current.id)}>
                    Actualizar
                  </Button>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>

        {/* ── Derecha: cola de despachos — la lista real, filtrable y paginada ── */}
        <Card className="overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4">
            <h3 className="text-sm font-semibold text-ink-100">Despachos recientes</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={soloContingencia ? 'outline' : 'ghost'}
                leftIcon={<FileWarning className="h-3.5 w-3.5" />}
                onClick={() => { setSoloContingencia((v) => !v); setPage(1); }}
              >
                Contingencia
              </Button>
              <div className="w-52">
                <Select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e === '' ? 'Todos los estados' : e.replace(/_/g, ' ')}</option>)}
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4"><SkeletonRows rows={6} /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={Pill} title="Sin despachos" description="No hay recetas que coincidan con el filtro seleccionado." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                      <th className="px-5 py-3 font-medium">Paciente</th>
                      <th className="px-5 py-3 font-medium">Medicamento</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d, i) => (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => seleccionar(d.id)}
                        className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${current?.id === d.id ? 'bg-brand-500/[0.06]' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={d.paciente_nombre ?? d.id_paciente} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-100">{d.paciente_nombre ?? d.id_paciente}</p>
                              <p className="truncate font-mono text-[11px] text-ink-500">{d.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-ink-200">{medicamento(d)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <EstadoRecetaBadge estado={d.estado} />
                            {d.contingencia_url_descarga && (
                              <ContingenciaBadge urlDescarga={d.contingencia_url_descarga} esContingencia={!!d.es_contingencia} />
                            )}
                          </div>
                          {d.motivo_rechazo && <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-rose-300/70">{d.motivo_rechazo}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip content="Ver detalle completo">
                              <button
                                onClick={(e) => { e.stopPropagation(); setIdDetalle(d.id); }}
                                className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-ink-100"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </Tooltip>
                            {(d.estado === 'RECHAZADA_POR_VALIDACION' || d.estado === 'RECHAZADA_POR_STOCK') && (
                              <Tooltip content="Reintentar envío">
                                <button
                                  onClick={(e) => { e.stopPropagation(); reintentar.mutate(d.id); }}
                                  className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-brand-300"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            )}
                            {puedeMarcarRetirada && d.estado === 'DESPACHADA' && (
                              <Tooltip content="Marcar retirada">
                                <button
                                  onClick={(e) => { e.stopPropagation(); retirar.mutate(d.id); }}
                                  className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-emerald-300"
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </button>
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
                  <p className="text-xs text-ink-400">{meta.total} despacho{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages || 1}</p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>Anterior</Button>
                    <Button variant="secondary" size="sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>Siguiente</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <RecetaDetalleModal idReceta={idDetalle} open={!!idDetalle} onOpenChange={(o) => !o && setIdDetalle(null)} />
    </div>
  );
}
