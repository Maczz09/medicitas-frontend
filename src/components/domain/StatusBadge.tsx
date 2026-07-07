import { FileWarning } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import type { EstadoCita, EstadoCobertura, EstadoPago, EstadoReceta } from '@/types';

const citaMap: Record<EstadoCita, { tone: BadgeTone; label: string }> = {
  Pendiente: { tone: 'warning', label: 'Pendiente' },
  En_Atencion: { tone: 'info', label: 'En atención' },
  Completada: { tone: 'success', label: 'Completada' },
  Cancelada: { tone: 'neutral', label: 'Cancelada' },
  No_Asistida: { tone: 'danger', label: 'No asistió' },
};

export function EstadoCitaBadge({ estado }: { estado: EstadoCita }) {
  const m = citaMap[estado] ?? { tone: 'neutral' as BadgeTone, label: estado };
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

const recetaMap: Record<EstadoReceta, { tone: BadgeTone; label: string }> = {
  CREADA: { tone: 'neutral', label: 'Creada' },
  ENVIADA_A_FARMACIA: { tone: 'info', label: 'Enviada' },
  DESPACHADA: { tone: 'success', label: 'Despachada' },
  RECHAZADA_POR_STOCK: { tone: 'warning', label: 'Sin stock' },
  RECHAZADA_POR_VALIDACION: { tone: 'danger', label: 'Rechazada' },
  RETIRADA: { tone: 'brand', label: 'Retirada' },
};

export function EstadoRecetaBadge({ estado }: { estado: EstadoReceta }) {
  const m = recetaMap[estado] ?? { tone: 'neutral' as BadgeTone, label: estado };
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** Enlace al PDF de contingencia — solo se renderiza si la receta se generó con farmacia caída. */
export function ContingenciaBadge({ urlDescarga }: { urlDescarga: string }) {
  return (
    <a
      href={urlDescarga}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Receta de contingencia: farmacia no estaba disponible al emitirla. Click para ver el PDF."
    >
      <Badge tone="warning" className="hover:ring-warn/50">
        <FileWarning className="h-3 w-3" />
        Contingencia
      </Badge>
    </a>
  );
}

const coberturaMap: Record<EstadoCobertura, { tone: BadgeTone; label: string }> = {
  APROBADA: { tone: 'success', label: 'Aprobada' },
  RECHAZADA: { tone: 'danger', label: 'Rechazada' },
  PENDIENTE: { tone: 'warning', label: 'Pendiente' },
};

export function EstadoCoberturaBadge({ estado }: { estado: EstadoCobertura }) {
  const m = coberturaMap[estado] ?? { tone: 'neutral' as BadgeTone, label: estado };
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

const pagoMap: Record<EstadoPago, { tone: BadgeTone; label: string }> = {
  APROBADO: { tone: 'success', label: 'Aprobado' },
  PROCESADO: { tone: 'success', label: 'Procesado' },
  PENDIENTE: { tone: 'warning', label: 'Pendiente' },
  REVERSADO: { tone: 'neutral', label: 'Reversado' },
  FALLIDO: { tone: 'danger', label: 'Fallido' },
};

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  const m = pagoMap[estado] ?? { tone: 'neutral' as BadgeTone, label: estado };
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}
