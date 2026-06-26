import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
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
import { EstadoCoberturaBadge } from '@/components/domain/StatusBadge';
import { CoverageResultBanner } from '@/components/domain/CoverageResultBanner';
import { PatientPicker } from '@/components/domain/PatientPicker';
import { coberturasApi } from '@/api/coberturas.api';
import { apiError } from '@/api/http';
import { useActivityStore } from '@/store/activity.store';
import { fmtMoney } from '@/lib/format';
import type { Paciente, ResultadoCobertura, TipoConsulta } from '@/types';

const TIPOS: { value: TipoConsulta; label: string }[] = [
  { value: 'CONSULTA_GENERAL', label: 'Consulta general' },
  { value: 'CONSULTA_ESPECIALIDAD', label: 'Consulta de especialidad' },
  { value: 'EMERGENCIA', label: 'Emergencia' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
];

export default function ValidarCoberturaPage() {
  const location = useLocation();
  const prefill = (location.state as { paciente?: Paciente } | null)?.paciente ?? null;

  const { coberturas, addCobertura } = useActivityStore();
  const [paciente, setPaciente] = useState<Paciente | null>(prefill);
  const idAseguradora = 'ASEG-PROSALUD'; // fijo: la clínica trabaja con una aseguradora
  const [documento, setDocumento] = useState(prefill?.numero_documento ?? '');
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>('CONSULTA_GENERAL');
  const [result, setResult] = useState<ResultadoCobertura | null>(null);

  const validar = useMutation({
    mutationFn: () =>
      coberturasApi.validar(
        { idPaciente: paciente!.id_paciente, idAseguradora, numeroPoliza: documento, tipoConsulta },
        crypto.randomUUID(),
      ),
    onSuccess: (res) => {
      setResult(res);
      addCobertura({
        idValidacion: res.idValidacion,
        idPaciente: paciente!.id_paciente,
        pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : undefined,
        numeroPoliza: documento,
        estadoCobertura: res.estadoCobertura,
        porcentajeCobertura: res.porcentajeCobertura,
        codigoAutorizacion: res.codigoAutorizacion,
        ts: Date.now(),
      });
      toast.success('Validación completada');
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo validar la cobertura')),
  });

  const canSubmit = paciente && idAseguradora && documento;

  return (
    <div>
      <PageHeader title="Validar cobertura" subtitle="Consulta la cobertura del seguro del paciente" />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <ShieldCheck className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Datos de la póliza</h3>
          </div>
          <CardBody className="space-y-4">
            <PatientPicker
              value={paciente}
              onChange={(p) => {
                setPaciente(p);
                if (p) setDocumento(p.numero_documento); // autocompleta el documento del paciente
              }}
            />
            <Input
              label="Aseguradora"
              value={idAseguradora}
              readOnly
              className="cursor-not-allowed opacity-70"
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label="N° de documento del asegurado"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej. 12345678"
              hint="Se completa con el documento del paciente. Pruebas: 12345678 → 80% · CE123456 → 100%"
            />
            <Select label="Tipo de consulta" value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value as TipoConsulta)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Button className="w-full" disabled={!canSubmit} loading={validar.isPending} leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => validar.mutate()}>
              Validar cobertura
            </Button>
          </CardBody>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          {result ? (
            <CoverageResultBanner result={result} />
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={ShieldCheck}
                  title="Sin validación todavía"
                  description="Completa los datos y valida la cobertura para ver el resultado y el porcentaje de descuento."
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Validaciones recientes</h3>
            </div>
            {coberturas.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Sin historial" description="Tus validaciones aparecerán aquí." />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {coberturas.slice(0, 6).map((c) => (
                  <li key={c.idValidacion} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-100">
                        {c.pacienteNombre ?? c.idPaciente}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        Doc. {c.numeroPoliza} · {c.porcentajeCobertura}% · {fmtMoney(0)}
                      </p>
                    </div>
                    <EstadoCoberturaBadge estado={c.estadoCobertura} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
