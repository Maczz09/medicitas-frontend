import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Select, SkeletonRows, type BadgeTone } from '@/components/ui';
import { notificacionesApi } from '@/api/notificaciones.api';
import { fmtDateTime } from '@/lib/format';

const ESTADOS = ['', 'PENDIENTE', 'ENVIADO', 'FALLIDO'];
const tone: Record<string, BadgeTone> = { ENVIADO: 'success', PENDIENTE: 'warning', FALLIDO: 'danger' };

export default function AdminNotificacionesPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notificaciones', page, estado],
    queryFn: () => notificacionesApi.list({ page, limit: 12, estado: estado || undefined }),
    placeholderData: keepPreviousData,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Notificaciones" subtitle="Registro de mensajes SMS enviados por el sistema" />
      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] p-4">
          <div className="max-w-xs">
            <Select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e === '' ? 'Todos los estados' : e}</option>)}
            </Select>
          </div>
        </div>
        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="Sin notificaciones" description="Aún no se han enviado SMS." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Evento</th>
                    <th className="px-5 py-3 font-medium">Teléfono</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Contenido</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="hidden px-5 py-3 font-medium md:table-cell">Enviado</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Correlación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((n, i) => (
                    <motion.tr key={n.id_mensaje} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-medium text-ink-100">{n.tipo_evento}</td>
                      <td className="px-5 py-3 font-mono text-ink-300">{n.telefono_destino}</td>
                      <td className="hidden max-w-[280px] truncate px-5 py-3 text-ink-400 lg:table-cell">{n.contenido}</td>
                      <td className="px-5 py-3">
                        <Badge tone={tone[n.estado] ?? 'neutral'} dot>{n.estado}</Badge>
                        {n.error_msg && <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-rose-300/70">{n.error_msg}</p>}
                      </td>
                      <td className="hidden px-5 py-3 text-ink-400 md:table-cell">{n.enviado_en ? fmtDateTime(n.enviado_en) : '—'}</td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-500 xl:table-cell">{n.correlation_id?.slice(0, 10) ?? '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-xs text-ink-400">{meta.total} mensajes · página {meta.page} de {meta.totalPages || 1}</p>
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
  );
}
