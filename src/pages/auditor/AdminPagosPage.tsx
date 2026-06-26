import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, Receipt, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, SkeletonRows, Tooltip } from '@/components/ui';
import { EstadoPagoBadge } from '@/components/domain/StatusBadge';
import { pagosApi } from '@/api/pagos.api';
import { facturacionApi } from '@/api/facturacion.api';
import { apiError } from '@/api/http';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import type { EstadoPago, PagoAdmin } from '@/types';

export default function AdminPagosPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [reverseTarget, setReverseTarget] = useState<PagoAdmin | null>(null);
  const [motivo, setMotivo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pagos', page],
    queryFn: () => pagosApi.list({ page, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  const reversar = useMutation({
    mutationFn: () => pagosApi.reversar(reverseTarget!.id_pago, motivo),
    onSuccess: () => {
      toast.success('Pago reversado');
      qc.invalidateQueries({ queryKey: ['admin-pagos'] });
      setReverseTarget(null);
      setMotivo('');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const verComprobante = useMutation({
    mutationFn: (idPago: string) => facturacionApi.comprobantePorPago(idPago),
    onSuccess: (d: unknown) => {
      const id = (d as { idComprobante?: string; id?: string }).idComprobante ?? (d as { id?: string }).id;
      if (id) window.open(facturacionApi.pdfUrl(id), '_blank');
      else toast('Sin PDF disponible', { icon: 'ℹ️' });
    },
    onError: () => toast('El comprobante aún se genera o no existe', { icon: '⏳' }),
  });

  const pagos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Pagos" subtitle="Todos los pagos del sistema, comprobantes y reversiones" />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRows rows={6} /></div>
        ) : pagos.length === 0 ? (
          <EmptyState icon={Receipt} title="Sin pagos" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Método</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Copago</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Comprobante</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pg, i) => (
                    <motion.tr key={pg.id_pago} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={pg.paciente_nombre ?? pg.id_paciente} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-100">{pg.paciente_nombre ?? pg.id_paciente}</p>
                            <p className="truncate font-mono text-xs text-ink-500">{fmtDateTime(pg.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><Badge tone="neutral">{pg.metodo_pago}</Badge></td>
                      <td className="px-5 py-3 text-ink-200">{fmtMoney(pg.monto_total)}</td>
                      <td className="px-5 py-3 font-semibold text-ink-100">{fmtMoney(pg.monto_copago)}</td>
                      <td className="px-5 py-3"><EstadoPagoBadge estado={pg.estado as EstadoPago} /></td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-400 lg:table-cell">{pg.numero_comprobante ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Ver comprobante (PDF)">
                            <button onClick={() => verComprobante.mutate(pg.id_pago)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-brand-300"><FileText className="h-4 w-4" /></button>
                          </Tooltip>
                          {pg.estado !== 'REVERSADO' && (
                            <Tooltip content="Reversar pago">
                              <button onClick={() => setReverseTarget(pg)} className="rounded-lg p-2 text-ink-400 hover:bg-white/[0.06] hover:text-rose-300"><RotateCcw className="h-4 w-4" /></button>
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
                <p className="text-xs text-ink-400">{meta.total} pagos · página {meta.page} de {meta.totalPages || 1}</p>
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>Anterior</Button>
                  <Button variant="secondary" size="sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>Siguiente</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={!!reverseTarget}
        onOpenChange={(o) => !o && setReverseTarget(null)}
        title="Reversar pago"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReverseTarget(null)}>Volver</Button>
            <Button variant="danger" disabled={!motivo.trim()} loading={reversar.isPending} onClick={() => reversar.mutate()}>Reversar</Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-300">El motivo de reversión es obligatorio.</p>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reversión…" />
      </Modal>
    </div>
  );
}
