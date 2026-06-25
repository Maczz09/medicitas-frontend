import { motion } from 'framer-motion';
import { Activity, CalendarCheck, ShieldCheck, Stethoscope } from 'lucide-react';

const features = [
  { icon: CalendarCheck, text: 'Gestión de citas en tiempo real' },
  { icon: ShieldCheck, text: 'Validación de cobertura con aseguradoras' },
  { icon: Stethoscope, text: 'Historia clínica y prescripciones digitales' },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca — siempre oscuro (hero de marca) en ambos temas */}
      <div className="relative hidden overflow-hidden bg-[#0a1020] lg:block">
        <div className="absolute inset-0 bg-radial-brand" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
        <motion.div
          className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl"
          animate={{ y: [0, 24, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky2/10 blur-3xl"
          animate={{ y: [0, -28, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.4} />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              MediCitas
            </span>
          </div>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white"
            >
              La gestión clínica,
              <br />
              <span className="text-gradient">simple y conectada.</span>
            </motion.h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-300">
              Plataforma integral para recepción, atención médica y auditoría. Citas, seguros,
              pagos y farmacia en un solo lugar.
            </p>

            <div className="mt-8 space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <f.icon className="h-4.5 w-4.5 text-brand-300" />
                  </div>
                  <span className="text-sm text-ink-200">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-500">© {new Date().getFullYear()} MediCitas · Sistema de gestión hospitalaria</p>
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
