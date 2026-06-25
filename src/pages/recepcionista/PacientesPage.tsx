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
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  SkeletonRows,
  Tooltip,
  Avatar,
} from '@/components/ui';
import { PacienteFormModal } from '@/features/pacientes/PacienteFormModal';
import { ContactoFormModal } from '@/features/pacientes/ContactoFormModal';
import { usePacientesList, useToggleEstadoPaciente } from '@/features/pacientes/usePacientes';
import { useDebounce } from '@/hooks/useDebounce';
import { apiError } from '@/api/http';
import { fmtDate } from '@/lib/format';
import type { Paciente } from '@/types';

const isActivo = (p: Paciente) => p.activo === 1 || p.activo === true;

export default function PacientesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 350);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [toggling, setToggling] = useState<Paciente | null>(null);

  const { data, isLoading, isError } = usePacientesList({ q: debounced || undefined, page, limit: 8 });
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

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] p-4">
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, apellido o documento…"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <SkeletonRows rows={6} />
          </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-ink-400">
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Documento</th>
                    <th className="hidden px-5 py-3 font-medium md:table-cell">Teléfono</th>
                    <th className="hidden px-5 py-3 font-medium lg:table-cell">Registrado</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((p, i) => (
                    <motion.tr
                      key={p.id_paciente}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${p.nombre} ${p.apellido}`} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-100">
                              {p.nombre} {p.apellido}
                            </p>
                            <p className="text-xs text-ink-500">{p.tipo_documento}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-ink-200">{p.numero_documento}</td>
                      <td className="hidden px-5 py-3 text-ink-300 md:table-cell">{p.telefono}</td>
                      <td className="hidden px-5 py-3 text-ink-400 lg:table-cell">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3">
                        {isActivo(p) ? (
                          <Badge tone="success" dot>
                            Activo
                          </Badge>
                        ) : (
                          <Badge tone="neutral" dot>
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Ver detalle">
                            <button
                              onClick={() => navigate(`/recepcion/pacientes/${p.id_paciente}`)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Editar contacto">
                            <button
                              onClick={() => setEditing(p)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content={isActivo(p) ? 'Desactivar' : 'Activar'}>
                            <button
                              onClick={() => setToggling(p)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
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
      </Card>

      <PacienteFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <ContactoFormModal paciente={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
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
