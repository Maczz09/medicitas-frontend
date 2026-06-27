import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Power,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  SkeletonRows,
  Tooltip,
} from '@/components/ui';
import { PacienteFormModal } from '@/features/pacientes/PacienteFormModal';
import { PacienteEditModal } from '@/features/pacientes/PacienteEditModal';
import { usePacientesList, useToggleEstadoPaciente } from '@/features/pacientes/usePacientes';
import { useDebounce } from '@/hooks/useDebounce';
import { apiError } from '@/api/http';
import { fmtDate } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import { basePathForRole } from '@/lib/roles';
import type { Paciente } from '@/types';

const isActivo = (p: Paciente) => p.activo === 1 || p.activo === true;

export default function PacientesPage() {
  const navigate = useNavigate();
  const base = basePathForRole(useAuthStore((s) => s.user?.rol));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 350);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [toggling, setToggling] = useState<Paciente | null>(null);

  const { data, isLoading, isError } = usePacientesList({ q: debounced || undefined, page, limit: 9 });
  const toggleMutation = useToggleEstadoPaciente();

  const pacientes = data?.data ?? [];
  const meta = data?.meta;

  const confirmToggle = () => {
    if (!toggling) return;
    toggleMutation.mutate(
      { id: toggling.id_paciente, activo: !isActivo(toggling) },
      {
        onSuccess: () => {
          toast.success(isActivo(toggling) ? 'Paciente desactivado' : 'Paciente activado');
          setToggling(null);
        },
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Pacientes"
        subtitle="Busca, registra y gestiona los pacientes de la clínica"
        actions={
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            Nuevo paciente
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mb-5 max-w-md">
        <Input
          placeholder="Buscar por nombre, apellido o documento…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <Card>
          <div className="p-4"><SkeletonRows rows={6} /></div>
        </Card>
      ) : isError ? (
        <EmptyState icon={Users} title="No se pudieron cargar los pacientes" description="Revisa tu conexión e inténtalo de nuevo." />
      ) : pacientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description={debounced ? 'Ningún paciente coincide con tu búsqueda.' : 'Aún no hay pacientes registrados.'}
          action={
            <Button variant="secondary" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Registrar el primero
            </Button>
          }
        />
      ) : (
        <>
          {/* Card grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pacientes.map((p, i) => (
              <motion.div
                key={p.id_paciente}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                {/* Top: avatar + name + status */}
                <div className="flex items-start gap-3">
                  <Avatar name={`${p.nombre} ${p.apellido}`} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-100">
                      {p.nombre} {p.apellido}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-400">
                      {p.tipo_documento} {p.numero_documento}
                    </p>
                    {p.telefono && (
                      <p className="mt-0.5 text-xs text-ink-500">{p.telefono}</p>
                    )}
                  </div>
                  {isActivo(p) ? (
                    <Badge tone="success" dot>Activo</Badge>
                  ) : (
                    <Badge tone="neutral" dot>Inactivo</Badge>
                  )}
                </div>

                {/* Bottom: date + actions */}
                <div className="mt-3 flex items-center gap-1 border-t border-white/[0.04] pt-3">
                  <p className="flex-1 text-xs text-ink-600">
                    Registrado {fmtDate(p.created_at)}
                  </p>
                  <Tooltip content="Ver detalle">
                    <button
                      onClick={() => navigate(`${base}/pacientes/${p.id_paciente}`)}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Editar contacto">
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content={isActivo(p) ? 'Desactivar' : 'Activar'}>
                    <button
                      onClick={() => setToggling(p)}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {meta && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-400">
                {meta.total} paciente{meta.total === 1 ? '' : 's'} · página {meta.page} de {meta.totalPages || 1}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!!meta && page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PacienteFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <PacienteEditModal paciente={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling && isActivo(toggling) ? 'Desactivar paciente' : 'Activar paciente'}
        description={
          toggling
            ? `¿Confirmas ${isActivo(toggling) ? 'desactivar' : 'activar'} a ${toggling.nombre} ${toggling.apellido}?`
            : ''
        }
        confirmLabel={toggling && isActivo(toggling) ? 'Desactivar' : 'Activar'}
        tone={toggling && isActivo(toggling) ? 'danger' : 'primary'}
        loading={toggleMutation.isPending}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
