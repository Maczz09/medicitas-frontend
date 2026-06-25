import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GitBranch, ScrollText, Search } from 'lucide-react';
import { Badge, Card, EmptyState, Input, Modal, PageHeader, SkeletonRows } from '@/components/ui';
import { auditoriaApi } from '@/api/auditoria.api';
import { useDebounce } from '@/hooks/useDebounce';
import { fmtDateTime } from '@/lib/format';
import type { Traza } from '@/types';

function servicioTone(servicio: string) {
  const map: Record<string, 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    svc_cit: 'info',
    svc_pag: 'success',
    svc_seg: 'brand',
    svc_pre: 'warning',
    svc_hcl: 'danger',
  };
  return map[servicio] ?? 'neutral';
}

export default function TrazasPage() {
  const [servicio, setServicio] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [correlacion, setCorrelacion] = useState<string | null>(null);

  const dServicio = useDebounce(servicio, 300);
  const dTipo = useDebounce(tipoEvento, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['trazas', dServicio, dTipo],
    queryFn: () =>
      auditoriaApi.trazas({
        servicio: dServicio || undefined,
        tipoEvento: dTipo || undefined,
        porPagina: 50,
      }),
  });

  const flujo = useQuery({
    queryKey: ['correlacion', correlacion],
    queryFn: () => auditoriaApi.correlacion(correlacion!),
    enabled: !!correlacion,
  });

  return (
    <div>
      <PageHeader title="Trazas de auditoría" subtitle="Cada evento del sistema, con su flujo de correlación" />

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-2">
          <Input placeholder="Filtrar por servicio (ej. svc_pag)" leftIcon={<Search className="h-4 w-4" />} value={servicio} onChange={(e) => setServicio(e.target.value)} />
          <Input placeholder="Filtrar por evento (ej. PagoAprobado)" leftIcon={<Search className="h-4 w-4" />} value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={8} /></div>
        ) : !data?.trazas.length ? (
          <EmptyState icon={ScrollText} title="Sin trazas" description="No hay eventos que coincidan con los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Evento</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Correlación</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Registrado</th>
                  <th className="px-5 py-3 text-right font-medium">Flujo</th>
                </tr>
              </thead>
              <tbody>
                {data.trazas.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Badge tone={servicioTone(t.servicioOrigen)}>{t.servicioOrigen}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-ink-100">{t.tipoEvento}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-ink-400 lg:table-cell">{t.correlationId?.slice(0, 12) ?? '—'}</td>
                    <td className="hidden px-5 py-3 text-ink-400 md:table-cell">{fmtDateTime(t.recibidoEn)}</td>
                    <td className="px-5 py-3 text-right">
                      {t.correlationId && (
                        <button onClick={() => setCorrelacion(t.correlationId)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-300 transition-colors hover:bg-brand-500/10">
                          <GitBranch className="h-3.5 w-3.5" />
                          Ver flujo
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 text-xs text-ink-400">{data.total} traza(s)</div>
          </div>
        )}
      </Card>

      <Modal open={!!correlacion} onOpenChange={(o) => !o && setCorrelacion(null)} title="Flujo de correlación" description={correlacion ?? undefined} size="lg">
        {flujo.isLoading ? (
          <SkeletonRows rows={4} />
        ) : !flujo.data?.length ? (
          <p className="text-sm text-ink-400">Sin eventos para esta correlación.</p>
        ) : (
          <div className="space-y-0">
            {flujo.data.map((t: Traza, i: number) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="relative border-l-2 border-white/[0.08] pb-5 pl-5 last:pb-0">
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-navy-800" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={servicioTone(t.servicioOrigen)}>{t.servicioOrigen}</Badge>
                  <span className="text-sm font-semibold text-ink-100">{t.tipoEvento}</span>
                  <span className="text-xs text-ink-500">{fmtDateTime(t.recibidoEn)}</span>
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
