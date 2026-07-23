import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Droplet, FileHeart, Pencil, Pill, Plus, ShieldAlert, Stethoscope, TriangleAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, CardBody, EmptyState, FullSpinner, PageHeader, Select, Tooltip } from '@/components/ui';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { hclApi } from '@/api/hcl.api';
import { apiError } from '@/api/http';
import { fmtDateTime } from '@/lib/format';
import type { Paciente } from '@/types';

const GRUPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HistoriaClinicaPage() {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const id = paciente?.id_paciente;
  const qc = useQueryClient();

  const resumen = useQuery({
    queryKey: ['hcl-resumen', id],
    queryFn: () => hclApi.resumen(id!),
    enabled: !!id,
    retry: false,
  });

  const historico = useQuery({
    queryKey: ['hcl-encuentros', id],
    queryFn: () => hclApi.encuentros(id!, { pagina: 1, porPagina: 20 }),
    enabled: !!id,
    retry: false,
  });

  // ── Editar expediente ──
  const [editOpen, setEditOpen] = useState(false);
  const [grupo, setGrupo] = useState('');
  const [alergiaInput, setAlergiaInput] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);

  const openEdit = () => {
    setGrupo(resumen.data?.grupoSanguineo ?? '');
    const raw = resumen.data?.alergiasConocidas;
    setAlergias(Array.isArray(raw) ? raw : []);
    setAlergiaInput('');
    setEditOpen(true);
  };

  const addAlergia = () => {
    const v = alergiaInput.trim();
    if (v && !alergias.includes(v)) setAlergias((a) => [...a, v]);
    setAlergiaInput('');
  };

  const actualizar = useMutation({
    mutationFn: () =>
      hclApi.actualizarExpediente(id!, { grupoSanguineo: grupo || undefined, alergias }),
    onSuccess: () => {
      toast.success('Expediente actualizado');
      qc.invalidateQueries({ queryKey: ['hcl-resumen', id] });
      setEditOpen(false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar')),
  });

  const sinExpediente = resumen.isError;

  return (
    <div>
      <PageHeader title="Historia clínica" subtitle="Consulta el expediente y los encuentros del paciente" />

      <div className="mb-5 max-w-md">
        <PatientPicker value={paciente} onChange={setPaciente} />
      </div>

      {!paciente ? (
        <Card>
          <CardBody>
            <EmptyState icon={FileHeart} title="Selecciona un paciente" description="Busca un paciente para ver su historia clínica." />
          </CardBody>
        </Card>
      ) : sinExpediente ? (
        <Card>
          <CardBody>
            <EmptyState icon={FileHeart} title="Sin expediente" description="Este paciente aún no tiene expediente clínico. Se creará en su primera atención." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Resumen ── */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Resumen clínico</h3>
              {!resumen.isLoading && (
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              )}
            </div>
            <CardBody className="space-y-3">
              {resumen.isLoading ? (
                <FullSpinner />
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <Droplet className="h-5 w-5 text-rose-300" />
                    <div>
                      <p className="text-xs text-ink-500">Grupo sanguíneo</p>
                      <p className="text-sm font-semibold text-ink-100">{resumen.data?.grupoSanguineo || '—'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-amber-300" />
                      <p className="text-xs text-ink-500">Alergias conocidas</p>
                    </div>
                    {resumen.data?.alergiasConocidas?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {resumen.data.alergiasConocidas.map((a) => (
                          <Badge key={a} tone="warning">{a}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-ink-300">Sin alergias registradas</p>
                    )}
                  </div>
                  {resumen.data?.ultimaAtencion && (
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="text-xs text-ink-500">Última atención</p>
                      <p className="mt-0.5 text-sm text-ink-100">{resumen.data.ultimaAtencion.diagnosticoCie10}</p>
                      <p className="text-xs text-ink-500">{fmtDateTime(resumen.data.ultimaAtencion.fecha)}</p>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {/* ── Encuentros ── */}
          <Card className="lg:col-span-2">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Encuentros clínicos</h3>
            </div>
            {historico.isLoading ? (
              <FullSpinner />
            ) : !historico.data?.encuentros?.length ? (
              <EmptyState icon={Stethoscope} title="Sin encuentros" description="Aún no hay atenciones registradas." />
            ) : (
              <div className="space-y-0 p-5">
                {historico.data.encuentros.map((e, i) => (
                  <motion.div
                    key={e.idEncuentro}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative border-l-2 border-white/[0.08] pb-5 pl-5 last:pb-0"
                  >
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-navy-850" />
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{e.diagnosticoCie10}</Badge>
                      <span className="text-xs text-ink-500">{fmtDateTime(e.fecha)}</span>
                      {e.citaCompletadaVerificada === false && (
                        <Tooltip content="Se registró con Citas no disponible — la cita se marcará Completada sola cuando el servicio se recupere, o quedará marcada para revisión si ya no aplica.">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
                        </Tooltip>
                      )}
                    </div>
                    {e.descripcion && <p className="mt-1.5 text-sm text-ink-200">{e.descripcion}</p>}
                    {e.prescripciones?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {e.prescripciones.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs text-ink-400">
                            <Pill className="h-3.5 w-3.5 text-brand-300" />
                            <span className="text-ink-200">{p.medicamento}</span> · {p.dosis}
                            {p.indicaciones && <span className="text-ink-500">· {p.indicaciones}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Modal editar expediente ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-navy-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h3 className="font-semibold text-ink-100">Editar expediente</h3>
              <button onClick={() => setEditOpen(false)} className="rounded-lg p-1 text-ink-400 hover:text-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <Select label="Grupo sanguíneo" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
                <option value="">No especificado</option>
                {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-300">Alergias conocidas</label>
                <div className="flex gap-2">
                  <input
                    className="h-9 flex-1 rounded-lg border border-white/10 bg-navy-900/60 px-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500/60 focus:outline-none"
                    placeholder="Ej. Penicilina"
                    value={alergiaInput}
                    onChange={(e) => setAlergiaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlergia())}
                  />
                  <button
                    onClick={addAlergia}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-300 hover:bg-white/[0.06]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {alergias.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {alergias.map((a) => (
                      <span key={a} className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-300">
                        {a}
                        <button onClick={() => setAlergias((arr) => arr.filter((x) => x !== a))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-xs text-ink-500">Presiona Enter o + para agregar</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={() => actualizar.mutate()} loading={actualizar.isPending}>
                Guardar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
