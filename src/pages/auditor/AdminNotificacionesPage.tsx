import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, PageHeader, Pagination, SkeletonRows, type BadgeTone } from '@/components/ui';
import { ListToolbar } from '@/components/domain/ListToolbar';
import { notificacionesApi } from '@/api/notificaciones.api';
import { fmtDateTime } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import type { Paciente } from '@/types';

const ESTADOS = ['', 'PENDIENTE', 'ENVIADO', 'FALLIDO'];
const ESTADO_OPTIONS = ESTADOS.map((e) => ({ value: e, label: e === '' ? 'Todos los estados' : e }));
const tone: Record<string, BadgeTone> = { ENVIADO: 'success', PENDIENTE: 'warning', FALLIDO: 'danger' };

export default function AdminNotificacionesPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notificaciones.admin(page, estado, debouncedSearch, paciente?.id_paciente),
    queryFn: () => notificacionesApi.list({
      page, limit: 12, estado: estado || undefined,
      q: debouncedSearch || undefined, idPaciente: paciente?.id_paciente,
    }),
    placeholderData: keepPreviousData,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader title="Notificaciones" subtitle="Registro de mensajes SMS enviados por el sistema" />
      <Card className="overflow-hidden">
        <ListToolbar
          search={{
            value: search,
            onChange: (v) => { setSearch(v); setPage(1); },
            placeholder: 'Buscar por evento, teléfono o contenido…',
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
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="Sin notificaciones" description="Aún no se han enviado SMS." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Paciente</th>
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
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={n.paciente_nombre ?? n.id_paciente ?? '—'} size="sm" />
                          <span className="truncate font-medium text-ink-100">{n.paciente_nombre ?? n.id_paciente ?? '—'}</span>
                        </div>
                      </td>
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
            <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="mensajes" />
          </>
        )}
      </Card>
    </div>
  );
}
