import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Droplet, FileHeart, Pill, Stethoscope, TriangleAlert } from 'lucide-react';
import { Badge, Card, CardBody, EmptyState, FullSpinner, PageHeader } from '@/components/ui';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { hclApi } from '@/api/hcl.api';
import { fmtDateTime } from '@/lib/format';
import type { Paciente } from '@/types';

export default function HistoriaClinicaPage() {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const id = paciente?.id_paciente;

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
          {/* Resumen */}
          <Card className="lg:col-span-1">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Resumen clínico</h3>
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

          {/* Encuentros */}
          <Card className="lg:col-span-2">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Encuentros clínicos</h3>
            </div>
            {historico.isLoading ? (
              <FullSpinner />
            ) : !historico.data?.encuentros.length ? (
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
                    </div>
                    {e.descripcion && <p className="mt-1.5 text-sm text-ink-200">{e.descripcion}</p>}
                    {e.prescripciones.length > 0 && (
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
    </div>
  );
}
