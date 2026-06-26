import { useQuery } from '@tanstack/react-query';
import { CalendarClock, IdCard, Mail, Shield, Stethoscope, UserRound } from 'lucide-react';
import { Modal, Avatar, Badge, type BadgeTone } from '@/components/ui';
import { useMedicos } from '@/hooks/useMedicos';
import { medicosApi } from '@/api/medicos.api';
import { fmtDateTime } from '@/lib/format';
import type { Role, UsuarioAdmin } from '@/types';

const roleTone: Record<Role, BadgeTone> = {
  Recepcionista: 'brand',
  Médico: 'success',
  Auditor: 'warning',
};

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <div className="truncate text-sm text-ink-100">{value || '—'}</div>
      </div>
    </div>
  );
}

interface Props {
  usuario: UsuarioAdmin | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function UserProfileModal({ usuario, open, onOpenChange }: Props) {
  const { data: medicos } = useMedicos();
  const medico = usuario?.id_medico ? medicos?.find((m) => m.id_medico === usuario.id_medico) : null;

  const disp = useQuery({
    queryKey: ['disponibilidad', usuario?.id_medico],
    queryFn: () =>
      medicosApi.disponibilidad(usuario!.id_medico!) as Promise<{
        horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
        bloqueos?: { motivo?: string }[];
      }>,
    enabled: !!usuario?.id_medico && open,
  });

  const activo = usuario ? usuario.activo === 1 || usuario.activo === true : false;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Perfil de usuario"
      description={usuario ? `${usuario.nombre} ${usuario.apellido}` : undefined}
      size="lg"
    >
      {usuario && (
        <div className="space-y-5">
          {/* Cabecera */}
          <div className="flex items-center gap-4">
            <Avatar name={`${usuario.nombre} ${usuario.apellido}`} size="lg" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink-100">
                {usuario.nombre} {usuario.apellido}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={roleTone[usuario.rolNombre] ?? 'neutral'}>{usuario.rolNombre}</Badge>
                {activo ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="neutral" dot>Inactivo</Badge>}
              </div>
            </div>
          </div>

          {/* Datos de cuenta */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Cuenta</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Row icon={UserRound} label="UUID" value={<span className="font-mono text-xs">{usuario.id_usuario}</span>} />
              <Row icon={Mail} label="Correo" value={usuario.email} />
              <Row icon={Shield} label="Rol" value={usuario.rolNombre} />
              <Row icon={CalendarClock} label="Registrado" value={fmtDateTime(usuario.created_at)} />
            </div>
          </div>

          {/* Perfil médico vinculado */}
          {usuario.id_medico && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Perfil médico vinculado
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row icon={Stethoscope} label="Especialidad" value={medico?.especialidad ?? '—'} />
                <Row icon={IdCard} label="CMP" value={medico?.cmp ?? '—'} />
                <Row icon={UserRound} label="ID médico" value={<span className="font-mono text-xs">{usuario.id_medico}</span>} />
              </div>

              {/* Agenda */}
              <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <p className="mb-2 text-xs text-ink-500">Horario semanal</p>
                {disp.isLoading ? (
                  <p className="text-xs text-ink-400">Cargando…</p>
                ) : disp.data?.horarios?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {disp.data.horarios.map((h, i) => (
                      <Badge key={i} tone="info">
                        {DIAS[h.dia_semana]} {h.hora_inicio}–{h.hora_fin}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400">Sin horario configurado.</p>
                )}
                {!!disp.data?.bloqueos?.length && (
                  <p className="mt-2 text-xs text-amber-300/80">{disp.data.bloqueos.length} bloqueo(s) vigente(s)</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
