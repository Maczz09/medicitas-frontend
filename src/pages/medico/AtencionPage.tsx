import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { hclApi } from '@/api/hcl.api';
import { apiError } from '@/api/http';
import { useActivityStore } from '@/store/activity.store';
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

export default function AtencionPage() {
  const citas = useActivityStore((s) => s.citas);
  const enAtencion = citas.filter((c) => c.estado === 'En_Atencion');

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [idCita, setIdCita] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prescs, setPrescs] = useState<PrescRow[]>([nuevaPresc()]);
  const [resultado, setResultado] = useState<ResultadoEncuentro | null>(null);

  const registrar = useMutation({
    mutationFn: async () => {
      // 1) Asegurar expediente (idempotente). 2) Registrar encuentro + prescripciones.
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
      setPrescs([nuevaPresc()]);
      setDiagnostico('');
      setDescripcion('');
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo registrar el encuentro')),
  });

  const canSubmit = paciente && idCita && diagnostico.trim();

  return (
    <div>
      <PageHeader title="Atención médica" subtitle="Registra el encuentro clínico y emite prescripciones" />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <Stethoscope className="h-4 w-4 text-ok" />
            <h3 className="text-sm font-semibold text-ink-100">Encuentro clínico</h3>
          </div>
          <CardBody className="space-y-4">
            {enAtencion.length > 0 && (
              <Select
                label="Cita en atención"
                value={idCita}
                onChange={(e) => {
                  setIdCita(e.target.value);
                  const c = enAtencion.find((x) => x.idCita === e.target.value);
                  if (c) {
                    setPaciente(
                      (prev) =>
                        prev ??
                        ({
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
                    {c.pacienteNombre ?? c.idCita} · {c.especialidad}
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

            {/* Prescripciones */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-ink-300">Prescripciones</label>
                <Button size="sm" variant="ghost" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setPrescs((p) => [...p, nuevaPresc()])}>
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
              <p className="mt-1.5 text-xs text-ink-500">
                Cada prescripción con medicamento y dosis se envía automáticamente a la farmacia.
              </p>
            </div>

            <Button className="w-full" disabled={!canSubmit} loading={registrar.isPending} onClick={() => registrar.mutate()}>
              Registrar encuentro y emitir recetas
            </Button>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          {resultado ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ok/15 text-emerald-300">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">Encuentro registrado</p>
                      <p className="text-xs text-ink-400">{resultado.estado}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                    <Field label="Encuentro" value={resultado.idEncuentro} mono />
                    <Field label="Expediente" value={resultado.idExpediente} mono />
                    <div className="mt-2 flex items-center gap-2 text-emerald-300">
                      <Pill className="h-4 w-4" />
                      {resultado.prescripcionesGeneradas} prescripción(es) enviada(s) a farmacia
                    </div>
                  </div>
                  {resultado.mensaje && <p className="text-xs text-ink-400">{resultado.mensaje}</p>}
                </CardBody>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={Stethoscope}
                  title="Sin encuentro registrado"
                  description="Completa el diagnóstico y las prescripciones para registrar la atención."
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`truncate text-xs text-ink-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
