import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { prescripcionesApi } from '@/api/prescripciones.api';
import { fmtDate, fmtDateTime } from '@/lib/format';

const ESTADO_LABEL: Record<string, string> = {
  CREADA: 'Creada',
  ENVIADA_A_FARMACIA: 'Enviada a farmacia',
  DESPACHADA: 'Despachada',
  RECHAZADA_POR_STOCK: 'Rechazada — sin stock',
  RECHAZADA_POR_VALIDACION: 'Rechazada',
  RETIRADA: 'Retirada por el paciente',
};

/**
 * Vista de solo impresión de una receta — sin AppLayout (sin sidebar/topbar)
 * para que el navegador imprima limpio por defecto. Fondo claro deliberado:
 * el tema oscuro de la app no sirve para papel/tinta.
 */
export default function RecetaImprimirPage() {
  const { id } = useParams<{ id: string }>();
  const yaImprimio = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['receta-detalle', id],
    queryFn: () => prescripcionesApi.getDetalle(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (data && !yaImprimio.current) {
      yaImprimio.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Spinner />
      </div>
    );
  }

  const esContingencia = !!data.recetaPDF?.esContingencia;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{'@page { margin: 1.5cm; } @media print { .no-imprimir { display: none !important; } }'}</style>

      <div className="no-imprimir sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
        <span className="text-sm text-slate-500">Vista de impresión — {data.idReceta}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-8 py-10 print:px-0 print:py-0">
        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">MediCitas</h1>
          <p className="text-xs text-slate-500">Plataforma de Atención Clínica y Gestión de Citas</p>
        </div>
        <hr className="my-4 border-slate-300" />

        {esContingencia && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
            <strong>⚠ RECETA DE CONTINGENCIA</strong> — generada porque el sistema de farmacia no estaba
            disponible al momento de la emisión. Presente esta receta junto con su documento de identidad.
          </div>
        )}

        <div className="text-center">
          <h2 className="text-lg font-semibold">RECETA MÉDICA</h2>
          <p className="text-sm text-slate-600">Nro: {data.idReceta}</p>
          <p className="text-xs text-slate-500">Fecha de emisión: {fmtDate(data.fechaEmision)}</p>
        </div>

        {/* ── Médico ─────────────────────────────────────────────────────── */}
        <section className="mt-6">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Médico tratante</h3>
          {data.medico ? (
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
              <p className="font-medium">Dr(a). {data.medico.nombre}</p>
              <p className="text-sm text-slate-600">
                CMP {data.medico.cmp} · {data.medico.especialidad}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sin datos del médico registrados.</p>
          )}
        </section>

        {/* ── Paciente ───────────────────────────────────────────────────── */}
        <section className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Paciente</h3>
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
            <p className="font-medium">{data.paciente.nombre ?? data.paciente.id}</p>
            <p className="text-sm text-slate-600">
              {data.paciente.tipoDocumento} {data.paciente.numeroDocumento}
            </p>
          </div>
          {data.cita && (
            <p className="mt-1 text-xs text-slate-500">
              Cita del {fmtDateTime(data.cita.fechaHora)} · {data.cita.especialidad}
              {data.encuentro?.diagnosticoCie10 ? ` · Dx: ${data.encuentro.diagnosticoCie10}` : ''}
            </p>
          )}
        </section>

        {/* ── Medicamento ────────────────────────────────────────────────── */}
        <section className="mt-6 rounded-lg border border-slate-300 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Medicamento prescrito</h3>
          <p className="text-xl font-semibold">{data.contenido?.medicamento ?? 'No especificado'}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700">
            {data.contenido?.dosis && <p><span className="text-slate-500">Dosis:</span> {data.contenido.dosis}</p>}
            {data.contenido?.cantidad != null && <p><span className="text-slate-500">Cantidad:</span> {data.contenido.cantidad}</p>}
            {data.contenido?.frecuencia && <p><span className="text-slate-500">Frecuencia:</span> {data.contenido.frecuencia}</p>}
            {data.contenido?.duracion && <p><span className="text-slate-500">Duración:</span> {data.contenido.duracion}</p>}
          </div>
          {data.contenido?.indicaciones && (
            <p className="mt-3 text-sm text-slate-700">
              <span className="text-slate-500">Indicaciones:</span> {data.contenido.indicaciones}
            </p>
          )}
        </section>

        {/* ── Despacho / Farmacia ────────────────────────────────────────── */}
        <section className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Farmacia: {data.farmacia.id}</span>
          <span>Estado: {ESTADO_LABEL[data.estado] ?? data.estado}</span>
          {data.referenciaFarmacia && <span>Ref: {data.referenciaFarmacia}</span>}
        </section>

        {/* ── Firma ──────────────────────────────────────────────────────── */}
        <div className="mt-16 flex justify-center">
          <div className="text-center">
            <div className="w-56 border-t border-slate-400" />
            <p className="mt-1 text-xs text-slate-500">Firma y sello del médico</p>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-slate-400">
          Documento generado por MediCitas · {data.idReceta} · correlationId: {data.correlationId ?? '—'}
        </p>
      </div>
    </div>
  );
}
