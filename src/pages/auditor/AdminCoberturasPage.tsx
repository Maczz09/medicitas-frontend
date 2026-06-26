import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Select, SkeletonRows } from '@/components/ui';
import { EstadoCoberturaBadge } from '@/components/domain/StatusBadge';
import { coberturasApi } from '@/api/coberturas.api';
import { fmtDate } from '@/lib/format';

const ESTADOS = ['', 'APROBADA', 'RECHAZADA', 'PENDIENTE'];

export default function AdminCoberturasPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coberturas', page, estado],
    queryFn: () => coberturasApi.list({ page, limit: 10, estado: estado || undefined }),
    placeholderData: keepPreviousData,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Cobertura" subtitle="Todas las validaciones de seguro del sistema" />
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
          <EmptyState icon={ShieldCheck} title="Sin validaciones" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Documento</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Cobertura</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Vigencia</th>
                    <th className="hidden px-5 py-3 font-medium xl:table-cell">Correlación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.paciente_nombre ?? c.id_paciente} size="sm" />
                          <span className="truncate font-medium text-ink-100">{c.paciente_nombre ?? c.id_paciente}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-ink-300">{c.numero_poliza}</td>
                      <td className="px-5 py-3 text-ink-300">{c.tipo_consulta?.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <EstadoCoberturaBadge estado={c.estado_cobertura} />
                          {c.es_fallback === 1 && <Badge tone="warning">fallback</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink-100">{Number(c.porcentaje_cobertura)}%</td>
                      <td className="hidden px-5 py-3 text-ink-400 lg:table-cell">{c.vigencia ? fmtDate(c.vigencia) : '—'}</td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-ink-500 xl:table-cell">{c.correlation_id?.slice(0, 10) ?? '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-xs text-ink-400">{meta.total} validaciones · página {meta.page} de {meta.totalPages || 1}</p>
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
