import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Printer, Stethoscope, Calendar, Pill, Building2, User } from 'lucide-react';
import { Button, Modal, Spinner } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { EstadoRecetaBadge, ContingenciaBadge } from './StatusBadge';
import { prescripcionesApi } from '@/api/prescripciones.api';
import { fmtDateTime } from '@/lib/format';

interface Props {
  idReceta: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-100">{value ?? '—'}</span>
    </div>
  );
}

function Seccion({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-300">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

/** Detalle completo de una receta: hora, médico (con CMP), cita y farmacia — usado por Médico/Recepción/Auditor. */
export function RecetaDetalleModal({ idReceta, open, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['receta-detalle', idReceta],
    queryFn: () => prescripcionesApi.getDetalle(idReceta as string),
    enabled: open && !!idReceta,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={idReceta ?? 'Receta'}
      description="Detalle completo de la receta"
      size="lg"
      footer={
        idReceta && (
          <Button
            variant="secondary"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => window.open(`/prescripciones/${idReceta}/imprimir`, '_blank', 'noopener,noreferrer')}
          >
            Imprimir receta
          </Button>
        )
      }
    >
      {isLoading || !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoRecetaBadge estado={data.estado} />
            {data.recetaPDF && (
              <ContingenciaBadge urlDescarga={data.recetaPDF.urlDescarga} esContingencia={data.recetaPDF.esContingencia} />
            )}
          </div>

          <Seccion icon={Pill} title="Medicamento">
            <Fila label="Medicamento" value={data.contenido?.medicamento} />
            <Fila label="Dosis" value={data.contenido?.dosis} />
            <Fila label="Cantidad" value={data.contenido?.cantidad} />
            {data.contenido?.frecuencia && <Fila label="Frecuencia" value={data.contenido.frecuencia} />}
            {data.contenido?.indicaciones && <Fila label="Indicaciones" value={data.contenido.indicaciones} />}
          </Seccion>

          <Seccion icon={User} title="Paciente">
            <Fila label="Nombre" value={data.paciente.nombre} />
            <Fila label="Documento" value={data.paciente.tipoDocumento && data.paciente.numeroDocumento ? `${data.paciente.tipoDocumento} ${data.paciente.numeroDocumento}` : null} />
            <Fila label="Teléfono" value={data.paciente.telefono} />
          </Seccion>

          <Seccion icon={Stethoscope} title="Médico">
            {data.medico ? (
              <>
                <Fila label="Nombre" value={data.medico.nombre} />
                <Fila label="CMP" value={data.medico.cmp} />
                <Fila label="Especialidad" value={data.medico.especialidad} />
              </>
            ) : (
              <p className="text-sm text-ink-500">Sin datos del médico para este despacho.</p>
            )}
          </Seccion>

          <Seccion icon={Calendar} title="Cita y encuentro clínico">
            {data.cita ? (
              <>
                <Fila label="Fecha de la cita" value={fmtDateTime(data.cita.fechaHora)} />
                <Fila label="Especialidad" value={data.cita.especialidad} />
                <Fila label="Estado de la cita" value={data.cita.estado} />
              </>
            ) : (
              <p className="text-sm text-ink-500">Sin cita asociada.</p>
            )}
            {data.encuentro?.diagnosticoCie10 && (
              <Fila label="Diagnóstico (CIE-10)" value={data.encuentro.diagnosticoCie10} />
            )}
          </Seccion>

          <Seccion icon={Building2} title="Farmacia">
            <Fila label="Farmacia" value={<Badge tone="brand">{data.farmacia.id}</Badge>} />
            <Fila label="Referencia de despacho" value={data.referenciaFarmacia} />
            {data.motivoRechazo && <Fila label="Motivo de rechazo" value={data.motivoRechazo} />}
          </Seccion>

          <Seccion icon={Calendar} title="Fechas">
            <Fila label="Emisión" value={fmtDateTime(data.fechaEmision)} />
            <Fila label="Despacho" value={fmtDateTime(data.fechaDespacho)} />
            <Fila label="Retiro" value={fmtDateTime(data.fechaRetiro)} />
            {data.recetaPDF && <Fila label="PDF generado" value={fmtDateTime(data.recetaPDF.generadaEn)} />}
          </Seccion>

          {data.recetaPDF && (
            <a
              href={data.recetaPDF.urlDescarga}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-500/20"
            >
              <ExternalLink className="h-4 w-4" />
              Descargar receta en PDF
            </a>
          )}

          <p className="text-center text-[11px] text-ink-600">correlationId: {data.correlationId ?? '—'}</p>
        </div>
      )}
    </Modal>
  );
}
