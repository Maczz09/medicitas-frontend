import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, GitBranch, RefreshCw, ScrollText, Search, User } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, SkeletonRows, Tooltip } from '@/components/ui';
import { auditoriaApi } from '@/api/auditoria.api';
import { useDebounce } from '@/hooks/useDebounce';
import { fmtDateTime } from '@/lib/format';
import type { Traza, TrazaActor } from '@/types';

const PER_PAGE = 20;
const REFETCH_MS = 15_000;

function servicioTone(servicio: string) {
  const map: Record<string, 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    svc_cit: 'info',
    svc_pag: 'success',
    svc_seg: 'brand',
    svc_pre: 'warning',
    svc_hcl: 'danger',
    svc_fac: 'success',
    svc_not: 'neutral',
    svc_aud: 'neutral',
    medicitas_users: 'info',
    svc_med: 'warning',
    svc_pac: 'success',
  };
  return map[servicio] ?? 'neutral';
}

/** Muestra el timestamp del evento (origen) con fallback al de registro */
function TiempoEvento({ timestampOrigen, recibidoEn }: { timestampOrigen: string | null; recibidoEn: string }) {
  if (timestampOrigen) {
    return (
      <Tooltip content={`Registrado: ${fmtDateTime(recibidoEn)}`}>
        <span className="cursor-default">{fmtDateTime(timestampOrigen)}</span>
      </Tooltip>
    );
  }
  return <span>{fmtDateTime(recibidoEn)}</span>;
}

function ActorCell({ actor }: { actor: TrazaActor | null }) {
  if (!actor?.nombre && !actor?.id) {
    return <span className="text-xs text-ink-500 italic">Sistema</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar name={actor.nombre ?? actor.id ?? '?'} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-200">{actor.nombre ?? actor.id}</p>
        {actor.rol && <p className="text-[10px] text-ink-500">{actor.rol}</p>}
      </div>
    </div>
  );
}

export default function TrazasPage() {
  const [servicio, setServicio] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [page, setPage] = useState(1);
  const [correlacion, setCorrelacion] = useState<string | null>(null);
  const qc = useQueryClient();

  const dServicio = useDebounce(servicio, 300);
  const dTipo = useDebounce(tipoEvento, 300);

  const trazasKey = ['trazas', dServicio, dTipo, page] as const;

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: trazasKey,
    queryFn: () =>
      auditoriaApi.trazas({
        servicio: dServicio || undefined,
        tipoEvento: dTipo || undefined,
        pagina: page,
        porPagina: PER_PAGE,
      }),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const flujo = useQuery({
    queryKey: ['correlacion', correlacion],
    queryFn: () => auditoriaApi.correlacion(correlacion!),
    enabled: !!correlacion,
    retry: false,
  });

  const trazas = data?.trazas ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div>
      <PageHeader
        title="Trazas de auditoría"
        subtitle="Cada evento del sistema: quién lo hizo, cuándo y con qué correlación"
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Filtrar por servicio (ej. svc_pac)"
              leftIcon={<Search className="h-4 w-4" />}
              value={servicio}
              onChange={(e) => { setServicio(e.target.value); setPage(1); }}
            />
            <Input
              placeholder="Filtrar por evento (ej. PacienteActualizado)"
              leftIcon={<Search className="h-4 w-4" />}
              value={tipoEvento}
              onChange={(e) => { setTipoEvento(e.target.value); setPage(1); }}
            />
          </div>
          <Tooltip content="Actualizar ahora">
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['trazas'] })}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-ink-400 transition-colors hover:bg-white/[0.04] hover:text-ink-200"
              aria-label="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>

        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={8} /></div>
        ) : trazas.length === 0 ? (
          <EmptyState icon={ScrollText} title="Sin trazas" description="No hay eventos que coincidan con los filtros." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Servicio</th>
                    <th className="px-5 py-3 font-medium">Evento</th>
                    <th className="hidden px-5 py-3 font-medium md:table-cell">Actor</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Correlación</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Fecha evento</th>
                    <th className="px-5 py-3 text-right font-medium">Flujo</th>
                  </tr>
                </thead>
                <tbody>
                  {trazas.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <Badge tone={servicioTone(t.servicioOrigen)}>{t.servicioOrigen}</Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-ink-100">{t.tipoEvento}</td>
                      <td className="hidden px-5 py-3 md:table-cell">
                        <ActorCell actor={t.actor} />
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-400 lg:table-cell">
                        {t.correlationId?.slice(0, 12) ?? '—'}
                      </td>
                      <td className="hidden px-5 py-3 text-ink-400 xl:table-cell">
                        <TiempoEvento timestampOrigen={t.timestampOrigen} recibidoEn={t.recibidoEn} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {t.correlationId && (
                          <Tooltip content="Ver flujo completo">
                            <button
                              onClick={() => setCorrelacion(t.correlationId)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-300 transition-colors hover:bg-brand-500/10"
                            >
                              <GitBranch className="h-3.5 w-3.5" />
                              Ver flujo
                            </button>
                          </Tooltip>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3.5">
              <p className="text-xs text-ink-400">
                {total} traza{total !== 1 ? 's' : ''} · página {page} de {totalPages}
                {lastUpdate && <span className="ml-2 text-ink-600">· actualizado {lastUpdate}</span>}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal flujo de correlación */}
      <Modal
        open={!!correlacion}
        onOpenChange={(o) => !o && setCorrelacion(null)}
        title="Flujo de correlación"
        description={correlacion ?? undefined}
        size="lg"
      >
        {flujo.isLoading ? (
          <SkeletonRows rows={4} />
        ) : flujo.isError ? (
          <p className="text-sm text-rose-300">
            No se pudo cargar el flujo. Verifica que el ID de correlación sea válido.
          </p>
        ) : !flujo.data?.length ? (
          <p className="text-sm text-ink-400">
            Sin eventos registrados para esta correlación. Es posible que el proceso aún esté en curso.
          </p>
        ) : (
          <div className="space-y-0">
            {(flujo.data as Traza[]).map((t, i) => (
              <motion.div
                key={t.id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative border-l-2 border-white/[0.08] pb-5 pl-5 last:pb-0"
              >
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-navy-800" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={servicioTone(t.servicioOrigen)}>{t.servicioOrigen}</Badge>
                  <span className="text-sm font-semibold text-ink-100">{t.tipoEvento}</span>
                  <span className="text-xs text-ink-500">
                    {fmtDateTime(t.timestampOrigen ?? t.recibidoEn)}
                  </span>
                  {t.actor?.nombre && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-300">
                      <User className="h-3 w-3" />
                      {t.actor.nombre}
                      {t.actor.rol && <span className="text-ink-500"> · {t.actor.rol}</span>}
                    </span>
                  )}
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-navy-950/60 p-2.5 text-[11px] leading-relaxed text-ink-300">
                  {JSON.stringify(t.payload, null, 2)}
                </pre>
              </motion.div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
