import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, FileText, Receipt, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Tooltip,
} from '@/components/ui';
import { EstadoPagoBadge } from '@/components/domain/StatusBadge';
import { pagosApi } from '@/api/pagos.api';
import { facturacionApi } from '@/api/facturacion.api';
import { apiError } from '@/api/http';
import { useActivityStore, type RecentPago } from '@/store/activity.store';
import { fmtMoney } from '@/lib/format';
import type { MetodoPago, TipoComprobante } from '@/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function PagosPage() {
  const { citas, coberturas, pagos, addPago, updatePago } = useActivityStore();

  const cobrables = citas.filter((c) => c.estado === 'En_Atencion' || c.estado === 'Completada');

  const [idCita, setIdCita] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [coberturaId, setCoberturaId] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');

  const [reverseTarget, setReverseTarget] = useState<RecentPago | null>(null);
  const [motivo, setMotivo] = useState('');

  const citaSel = cobrables.find((c) => c.idCita === idCita);
  const coberturaSel = coberturas.find((c) => c.idValidacion === coberturaId && c.estadoCobertura === 'APROBADA');

  const { cubierto, copago } = useMemo(() => {
    const total = parseFloat(montoTotal) || 0;
    const pct = coberturaSel?.porcentajeCobertura ?? 0;
    const c = round2((total * pct) / 100);
    return { cubierto: c, copago: round2(total - c) };
  }, [montoTotal, coberturaSel]);

  const confirmar = useMutation({
    mutationFn: () =>
      pagosApi.confirmar({
        idCita,
        idPaciente: citaSel?.idPaciente ?? '',
        metodoPago,
        montoTotal: parseFloat(montoTotal),
        montoCubiertoSeguro: cubierto,
        montoCopago: copago,
        tipoComprobante,
        idValidacionCobertura: coberturaSel?.idValidacion ?? null,
        codigoAutorizacionSeguro: coberturaSel?.codigoAutorizacion ?? null,
      }),
    onSuccess: (pago) => {
      addPago({
        idPago: pago.idPago,
        idCita: pago.idCita,
        estado: pago.estado,
        montoTotal: pago.montoTotal,
        montoCopago: pago.montoCopago,
        tipoComprobante: pago.tipoComprobante,
        pacienteNombre: citaSel?.pacienteNombre,
        ts: Date.now(),
      });
      toast.success('Pago registrado correctamente');
      setMontoTotal('');
      setIdCita('');
      setCoberturaId('');
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo registrar el pago')),
  });

  const reversar = useMutation({
    mutationFn: () => pagosApi.reversar(reverseTarget!.idPago, motivo),
    onSuccess: (pago) => {
      updatePago(pago.idPago, { estado: 'REVERSADO' });
      toast.success('Pago reversado');
      setReverseTarget(null);
      setMotivo('');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const verComprobante = useMutation({
    mutationFn: (idPago: string) => facturacionApi.comprobantePorPago(idPago),
    onSuccess: (data: unknown) => {
      const d = data as { idComprobante?: string; id?: string };
      const id = d.idComprobante ?? d.id;
      if (id) {
        window.open(facturacionApi.pdfUrl(id), '_blank');
      } else {
        toast('Comprobante encontrado, pero sin PDF disponible', { icon: 'ℹ️' });
      }
    },
    onError: () => toast('El comprobante aún se está generando. Intenta en unos segundos.', { icon: '⏳' }),
  });

  const canSubmit = idCita && citaSel && parseFloat(montoTotal) > 0;

  return (
    <div>
      <PageHeader title="Pagos" subtitle="Registra cobros y aplica el descuento de cobertura" />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Formulario */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <CreditCard className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Registrar pago</h3>
          </div>
          <CardBody className="space-y-4">
            <Select label="Cita a cobrar" value={idCita} onChange={(e) => setIdCita(e.target.value)}>
              <option value="">Selecciona una cita en atención…</option>
              {cobrables.map((c) => (
                <option key={c.idCita} value={c.idCita}>
                  {c.pacienteNombre ?? c.idCita} · {c.especialidad}
                </option>
              ))}
            </Select>
            {cobrables.length === 0 && (
              <p className="text-xs text-amber-300/80">
                No hay citas en atención. Registra el ingreso de una cita primero.
              </p>
            )}

            <Input
              label="Monto total (S/)"
              type="number"
              min="0"
              step="0.01"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="0.00"
            />

            <Select label="Cobertura a aplicar (opcional)" value={coberturaId} onChange={(e) => setCoberturaId(e.target.value)}>
              <option value="">Sin cobertura (copago total)</option>
              {coberturas
                .filter((c) => c.estadoCobertura === 'APROBADA')
                .map((c) => (
                  <option key={c.idValidacion} value={c.idValidacion}>
                    {c.pacienteNombre ?? c.idPaciente} · {c.porcentajeCobertura}%
                  </option>
                ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Método" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="POS">Tarjeta (POS)</option>
              </Select>
              <Select label="Comprobante" value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value as TipoComprobante)}>
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura</option>
              </Select>
            </div>

            <Button className="w-full" disabled={!canSubmit} loading={confirmar.isPending} onClick={() => confirmar.mutate()}>
              Confirmar pago
            </Button>
          </CardBody>
        </Card>

        {/* Desglose + recientes */}
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Desglose del cobro</h3>
            </div>
            <CardBody>
              <div className="space-y-2.5">
                <Row label="Monto total" value={fmtMoney(parseFloat(montoTotal) || 0)} />
                <Row
                  label={`Cubierto por seguro${coberturaSel ? ` (${coberturaSel.porcentajeCobertura}%)` : ''}`}
                  value={`− ${fmtMoney(cubierto)}`}
                  tone="ok"
                />
                <div className="my-2 h-px bg-white/[0.06]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-100">Copago del paciente</span>
                  <span className="font-display text-2xl font-bold text-ink-100">{fmtMoney(copago)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Pagos recientes</h3>
            </div>
            {pagos.length === 0 ? (
              <EmptyState icon={Receipt} title="Sin pagos" description="Los pagos registrados aparecerán aquí." />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {pagos.slice(0, 6).map((p) => (
                  <motion.li key={p.idPago} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-100">{p.pacienteNombre ?? p.idCita}</p>
                        <EstadoPagoBadge estado={p.estado} />
                      </div>
                      <p className="truncate text-xs text-ink-500">
                        {p.tipoComprobante} · copago {fmtMoney(p.montoCopago)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip content="Ver comprobante (PDF)">
                        <button
                          onClick={() => verComprobante.mutate(p.idPago)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      {p.estado !== 'REVERSADO' && (
                        <Tooltip content="Reversar pago">
                          <button
                            onClick={() => setReverseTarget(p)}
                            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={!!reverseTarget}
        onOpenChange={(o) => !o && setReverseTarget(null)}
        title="Reversar pago"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReverseTarget(null)}>
              Volver
            </Button>
            <Button variant="danger" loading={reversar.isPending} disabled={!motivo.trim()} onClick={() => reversar.mutate()}>
              Reversar
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-300">El motivo de reversión es obligatorio.</p>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reversión…" />
      </Modal>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'ok' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-400">{label}</span>
      <span className={tone === 'ok' ? 'text-emerald-300' : 'text-ink-200'}>{value}</span>
    </div>
  );
}
