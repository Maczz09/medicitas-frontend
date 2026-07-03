import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardBody,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { fmtDateTime } from '@/lib/format';
import { hclApi } from '@/api/hcl.api';
import { apiError } from '@/api/http';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import { useServerSync } from '@/hooks/useServerSync';
import type { Paciente, PrescripcionInput, ResultadoEncuentro } from '@/types';

interface PrescRow extends PrescripcionInput {
  key: string;
}

const nuevaPresc = (): PrescRow => ({
  key: crypto.randomUUID(),
  medicamento: '',
  dosis: '',
  indicaciones: '',
  cantidad: 1,
});

const STEPS = ['Paciente y cita', 'Diagnóstico', 'Prescripciones'];

export default function AtencionPage() {
  useServerSync();
  const user = useAuthStore((s) => s.user);
  const citas = useActivityStore((s) => s.citas);
  const misCitas   = user?.idMedico ? citas.filter((c) => c.idMedico === user.idMedico) : citas;
  const enAtencion = misCitas.filter((c) => c.estado === 'En_Atencion');

  const [step, setStep]             = useState(0);
  const [paciente, setPaciente]     = useState<Paciente | null>(null);
  const [idCita, setIdCita]         = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prescs, setPrescs]         = useState<PrescRow[]>([nuevaPresc()]);
  const [resultado, setResultado]   = useState<ResultadoEncuentro | null>(null);

  const registrar = useMutation({
    mutationFn: async () => {
      await hclApi.crearExpediente({ idPaciente: paciente!.id_paciente });
      const limpias = prescs
        .filter((p) => p.medicamento.trim() && p.dosis.trim())
        .map<PrescripcionInput>((p) => ({
          medicamento: p.medicamento,
          dosis: p.dosis,
          indicaciones: p.indicaciones || undefined,
          cantidad: Number(p.cantidad) || 1,
        }));
      return hclApi.registrarEncuentro(paciente!.id_paciente, {
        idCita,
        diagnosticoCie10: diagnostico.trim().toUpperCase(),
        descripcion: descripcion || undefined,
        prescripciones: limpias,
      });
    },
    onSuccess: (res) => {
      setResultado(res);
      toast.success('Encuentro clínico registrado');
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo registrar el encuentro')),
  });

  const canNext: boolean[] = [
    !!(paciente && idCita),
    diagnostico.trim().length > 0,
    true,
  ];

  const reset = () => {
    setStep(0);
    setPaciente(null);
    setIdCita('');
    setDiagnostico('');
    setDescripcion('');
    setPrescs([nuevaPresc()]);
    setResultado(null);
  };

  // ── Success screen ──
  if (resultado) {
    return (
      <div>
        <PageHeader title="Atención médica" subtitle="Registra el encuentro clínico y emite prescripciones" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md"
        >
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-300">Encuentro registrado</p>
                  <p className="text-xs text-ink-400">{resultado.estado}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 text-sm">
                <FieldRow label="Encuentro" value={resultado.idEncuentro} mono />
                <FieldRow label="Expediente" value={resultado.idExpediente} mono />
                <div className="flex items-center gap-2 pt-1 text-emerald-300">
                  <Pill className="h-4 w-4" />
                  <span>{resultado.prescripcionesGeneradas} prescripción(es) enviada(s) a farmacia</span>
                </div>
              </div>

              {resultado.mensaje && (
                <p className="text-xs text-ink-400">{resultado.mensaje}</p>
              )}

              <Button variant="secondary" className="w-full" onClick={reset}>
                Registrar otra atención
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Wizard ──
  return (
    <div>
      <PageHeader title="Atención médica" subtitle="Registra el encuentro clínico y emite prescripciones" />

      <div className="mx-auto max-w-2xl">
        {/* Progress stepper */}
        <div className="mb-6 flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-1 items-center">
              {i > 0 && (
                <div className={`h-px flex-1 ${i <= step ? 'bg-brand-500' : 'bg-white/[0.10]'}`} />
              )}
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1.5 px-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < step
                      ? 'bg-brand-500 text-white'
                      : i === step
                      ? 'border-2 border-brand-500 text-brand-300 bg-brand-500/10'
                      : 'border border-white/[0.15] text-ink-500'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-ink-200' : 'text-ink-500'}`}>
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? 'bg-brand-500' : 'bg-white/[0.10]'}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16 }}
            >
              {/* Step header */}
              <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="text-xs text-ink-500">Paso {step + 1} de {STEPS.length}</p>
                <h3 className="mt-0.5 text-base font-semibold text-ink-100 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-ok" />
                  {STEPS[step]}
                </h3>
              </div>

              {/* Step content */}
              <CardBody className="space-y-4">
                {step === 0 && (
                  <>
                    {enAtencion.length > 0 && (
                      <Select
                        label="Cita en atención (acceso rápido)"
                        value={idCita}
                        onChange={(e) => {
                          setIdCita(e.target.value);
                          const c = enAtencion.find((x) => x.idCita === e.target.value);
                          if (c) {
                            setPaciente(
                              (prev) =>
                                prev ?? ({
                                  id_paciente: c.idPaciente,
                                  nombre: c.pacienteNombre?.split(' ')[0] ?? 'Paciente',
                                  apellido: c.pacienteNombre?.split(' ').slice(1).join(' ') ?? '',
                                  tipo_documento: 'DNI',
                                  numero_documento: '',
                                  sexo: 'M',
                                  telefono: '',
                                  fecha_nacimiento: '',
                                  activo: 1,
                                } as Paciente),
                            );
                          }
                        }}
                      >
                        <option value="">Selecciona una cita…</option>
                        {enAtencion.map((c) => (
                          <option key={c.idCita} value={c.idCita}>
                            {c.pacienteNombre ?? c.idCita} · {c.especialidad} · {fmtDateTime(c.fechaHora)} · {c.idCita}
                          </option>
                        ))}
                      </Select>
                    )}
                    <PatientPicker value={paciente} onChange={setPaciente} />
                    <Input
                      label="ID de la cita (en atención)"
                      value={idCita}
                      onChange={(e) => setIdCita(e.target.value)}
                      placeholder="CIT-…"
                      hint="La cita debe estar En atención (ingreso registrado en recepción)"
                    />
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Diagnóstico CIE-10"
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                        placeholder="Ej. I10"
                      />
                      <div className="col-span-2">
                        <Input
                          label="Descripción"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Hallazgos / evolución"
                        />
                      </div>
                    </div>
                    {paciente && (
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                        <p className="text-xs text-ink-500">Paciente</p>
                        <p className="mt-0.5 font-medium text-ink-100">
                          {paciente.nombre} {paciente.apellido}
                        </p>
                        <p className="font-mono text-xs text-ink-500">{idCita}</p>
                      </div>
                    )}
                  </>
                )}

                {step === 2 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-xs font-medium text-ink-300">Prescripciones</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                        onClick={() => setPrescs((p) => [...p, nuevaPresc()])}
                      >
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {prescs.map((p) => (
                        <div key={p.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              className="col-span-5 h-9 rounded-lg border border-white/10 bg-navy-900/60 px-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500/60 focus:outline-none"
                              placeholder="Medicamento"
                              value={p.medicamento}
                              onChange={(e) => setPrescs((arr) => arr.map((x) => (x.key === p.key ? { ...x, medicamento: e.target.value } : x)))}
                            />
                            <input
                              className="col-span-3 h-9 rounded-lg border border-white/10 bg-navy-900/60 px-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500/60 focus:outline-none"
                              placeholder="Dosis"
                              value={p.dosis}
                              onChange={(e) => setPrescs((arr) => arr.map((x) => (x.key === p.key ? { ...x, dosis: e.target.value } : x)))}
                            />
                            <input
                              type="number"
                              min={1}
                              className="col-span-2 h-9 rounded-lg border border-white/10 bg-navy-900/60 px-3 text-sm text-ink-100 focus:border-brand-500/60 focus:outline-none"
                              placeholder="Cant."
                              value={p.cantidad}
                              onChange={(e) => setPrescs((arr) => arr.map((x) => (x.key === p.key ? { ...x, cantidad: Number(e.target.value) } : x)))}
                            />
                            <button
                              onClick={() => setPrescs((arr) => (arr.length > 1 ? arr.filter((x) => x.key !== p.key) : arr))}
                              className="col-span-2 flex items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <input
                            className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-navy-900/60 px-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500/60 focus:outline-none"
                            placeholder="Indicaciones (opcional)"
                            value={p.indicaciones}
                            onChange={(e) => setPrescs((arr) => arr.map((x) => (x.key === p.key ? { ...x, indicaciones: e.target.value } : x)))}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      Cada prescripción con medicamento y dosis se envía automáticamente a la farmacia.
                    </p>
                  </div>
                )}
              </CardBody>

              {/* Navigation */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext[step]}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    onClick={() => registrar.mutate()}
                    loading={registrar.isPending}
                    disabled={!paciente || !idCita || !diagnostico.trim()}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Registrar encuentro
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`truncate text-xs text-ink-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
