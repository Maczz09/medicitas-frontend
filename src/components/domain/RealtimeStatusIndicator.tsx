import { Tooltip } from '@/components/ui/Tooltip';
import { useRealtimeStore } from '@/store/realtime.store';

const META = {
  conectado: { color: 'bg-emerald-400', label: 'Tiempo real conectado', pulse: false },
  reconectando: { color: 'bg-amber-400', label: 'Reconectando…', pulse: true },
  desconectado: { color: 'bg-rose-400', label: 'Sin conexión en tiempo real', pulse: false },
} as const;

export function RealtimeStatusIndicator() {
  const status = useRealtimeStore((s) => s.status);
  const meta = META[status];

  return (
    <Tooltip content={meta.label}>
      <span className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.color} ${meta.pulse ? 'animate-pulse' : ''}`} />
      </span>
    </Tooltip>
  );
}
