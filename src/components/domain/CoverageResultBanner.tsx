import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/format';
import type { ResultadoCobertura } from '@/types';

const config = {
  APROBADA: {
    icon: CheckCircle2,
    ring: 'ring-ok/30',
    bg: 'bg-ok/[0.07]',
    text: 'text-emerald-300',
    label: 'Cobertura aprobada',
  },
  RECHAZADA: {
    icon: ShieldX,
    ring: 'ring-bad/30',
    bg: 'bg-bad/[0.07]',
    text: 'text-rose-300',
    label: 'Cobertura rechazada',
  },
  PENDIENTE: {
    icon: Clock,
    ring: 'ring-warn/30',
    bg: 'bg-warn/[0.07]',
    text: 'text-amber-300',
    label: 'Cobertura pendiente',
  },
} as const;

export function CoverageResultBanner({ result }: { result: ResultadoCobertura }) {
  const c = config[result.estadoCobertura] ?? config.PENDIENTE;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn('rounded-2xl p-5 ring-1 ring-inset', c.bg, c.ring)}
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]', c.text)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', c.text)}>{c.label}</p>

          {result.estadoCobertura === 'APROBADA' && (
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-4xl font-extrabold text-ink-100">
                {result.porcentajeCobertura}%
              </span>
              <span className="mb-1 text-sm text-ink-400">cubierto por el seguro</span>
            </div>
          )}

          {result.esFallback && result.estadoCobertura !== 'PENDIENTE' && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              Aseguradora no disponible — resultado servido desde el caché de contingencia (última
              validación exitosa conocida de este paciente), no en vivo.
            </p>
          )}

          {result.mensaje && <p className="mt-1.5 text-xs text-ink-400">{result.mensaje}</p>}

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            {result.codigoAutorizacion && (
              <div>
                <p className="text-ink-500">Autorización</p>
                <p className="truncate font-mono text-ink-200">{result.codigoAutorizacion}</p>
              </div>
            )}
            {result.vigencia && (
              <div>
                <p className="text-ink-500">Vigencia</p>
                <p className="text-ink-200">{fmtDate(result.vigencia)}</p>
              </div>
            )}
            <div>
              <p className="text-ink-500">ID validación</p>
              <p className="truncate font-mono text-ink-200">{result.idValidacion}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
