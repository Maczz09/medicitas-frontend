import { AlertTriangle } from 'lucide-react';
import { useResilienceStore } from '@/store/resilience.store';

// Invisible en el caso normal (sin degradación) — solo ocupa espacio cuando
// hay algo que mostrar. Un servicio puede estar en ambos sets a la vez
// (deshabilitado Y con circuito abierto); se prioriza el mensaje de
// deshabilitado por ser una acción deliberada, no una falla detectada.
export function ResilienceBanner() {
  const circuitosAbiertos = useResilienceStore((s) => s.circuitosAbiertos);
  const serviciosDeshabilitados = useResilienceStore((s) => s.serviciosDeshabilitados);

  const nombresConCircuitoAbierto = new Set(Object.values(circuitosAbiertos));
  const todosLosServicios = new Set([...nombresConCircuitoAbierto, ...serviciosDeshabilitados]);

  if (todosLosServicios.size === 0) return null;

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/[0.08] px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-amber-200">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Sistema degradado
        </span>
        {Array.from(todosLosServicios).map((servicio) => (
          <span key={servicio}>
            <span className="font-semibold">{servicio}</span>
            {' — '}
            {serviciosDeshabilitados.has(servicio)
              ? 'deshabilitado por un administrador'
              : 'no disponible temporalmente, recuperándose solo'}
          </span>
        ))}
      </div>
    </div>
  );
}
