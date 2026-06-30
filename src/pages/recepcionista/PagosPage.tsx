import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
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
import { useServerSync } from '@/hooks/useServerSync';
import { fmtMoney } from '@/lib/format';
import type { MetodoPago, TipoComprobante } from '@/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

function fmtCitaFecha(fechaHora?: string) {
  if (!fechaHora) return null;
  const d = new Date(fechaHora);
  return {
    fecha: d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function PagosPage() {
  useServerSync();
  const { citas, coberturas, pagos, addPago, updatePago } = useActivityStore();

  // Citas cobrables: estado válido Y sin pago activo (no reversado)
  const cobrables = citas.filter(
    (c) =>
      (c.estado === 'Pendiente' || c.estado === 'En_Atencion' || c.estado === 'Completada') &&
      !pagos.some((p) => p.idCita === c.idCita && p.estado !== 'REVERSADO'),
  );

  const [idCita, setIdCita]               = useState('');
  const [montoTotal, setMontoTotal]       = useState('');
  const [coberturaId, setCoberturaId]     = useState('');
  const [metodoPago, setMetodoPago]       = useState<MetodoPago>('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  const [dniTitular, setDniTitular]       = useState('');
  const [rucEmpresa, setRucEmpresa]       = useState('');

  const [reverseTarget, setReverseTarget] = useState<RecentPago | null>(null);
  const [motivo, setMotivo]               = useState('');

  const citaSel = cobrables.find((c) => c.idCita === idCita);

  // Solo coberturas aprobadas del paciente de la cita seleccionada
  const coberturasPaciente = coberturas.filter(
    (c) => c.estadoCobertura === 'APROBADA' && c.idPaciente === citaSel?.idPaciente,
  );
  const coberturaSel = coberturasPaciente.find((c) => c.idValidacion === coberturaId);

  // Auto-fill cobertura al seleccionar cita
  useEffect(() => {
    if (!citaSel) { setCoberturaId(''); return; }
    const match = coberturas.find(
      (c) => c.idPaciente === citaSel.idPaciente && c.estadoCobertura === 'APROBADA',
    );
    setCoberturaId(match?.idValidacion ?? '');
  }, [idCita]); // eslint-disable-line react-hooks/exhaustive-deps

  const { cubierto, copago } = useMemo(() => {
    const total = parseFloat(montoTotal) || 0;
    const pct   = coberturaSel?.porcentajeCobertura ?? 0;
    const c     = round2((total * pct) / 100);
    return { cubierto: c, copago: round2(total - c) };
  }, [montoTotal, coberturaSel]);

  const confirmar = useMutation({
    mutationFn: () =>
      pagosApi.confirmar({
        idCita,
        idPaciente:              citaSel?.idPaciente ?? '',
        metodoPago,
        montoTotal:              parseFloat(montoTotal),
        montoCubiertoSeguro:     cubierto,
        montoCopago:             copago,
        tipoComprobante,
        idValidacionCobertura:   coberturaSel?.idValidacion ?? null,
        codigoAutorizacionSeguro: coberturaSel?.codigoAutorizacion ?? null,
        dniTitular:  tipoComprobante === 'BOLETA'  ? dniTitular  || null : null,
        rucEmpresa:  tipoComprobante === 'FACTURA' ? rucEmpresa  || null : null,
      }),
    onSuccess: (pago) => {
      addPago({
        idPago:          pago.idPago,
        idCita:          pago.idCita,
        estado:          pago.estado,
        montoTotal:      pago.montoTotal,
        montoCopago:     pago.montoCopago,
        tipoComprobante: pago.tipoComprobante,
        pacienteNombre:  citaSel?.pacienteNombre,
        ts:              Date.now(),
      });
      toast.success('Pago registrado correctamente');
      setMontoTotal('');
      setIdCita('');
      setCoberturaId('');
      setDniTitular('');
      setRucEmpresa('');
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
      const d  = data as { idComprobante?: string; id?: string };
      const id = d.idComprobante ?? d.id;
      if (id) {
        window.open(facturacionApi.pdfUrl(id), '_blank');
      } else {
        toast('Comprobante encontrado, pero sin PDF disponible', { icon: 'ℹ️' });
      }
    },
    onError: () =>
      toast('El comprobante aún se está generando. Intenta en unos segundos.', { icon: '⏳' }),
  });

  const canSubmit = idCita && citaSel && parseFloat(montoTotal) > 0;
  const citaFmt   = fmtCitaFecha(citaSel?.fechaHora);

  return (
    <div>
      <PageHeader title="Pagos" subtitle="Registra cobros y aplica el descuento de cobertura" />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Formulario ── */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <CreditCard className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Registrar pago</h3>
          </div>
          <CardBody className="space-y-4">
            {/* Selector de cita */}
            <Select
              label="Cita a cobrar"
              value={idCita}
              onChange={(e) => setIdCita(e.target.value)}
            >
              <option value="">Selecciona una cita…</option>
              {cobrables.map((c) => {
                const f = fmtCitaFecha(c.fechaHora);
                const label = f
                  ? `${c.pacienteNombre ?? c.idPaciente} · ${f.fecha} ${f.hora}`
                  : `${c.pacienteNombre ?? c.idPaciente} · ${c.especialidad}`;
                return (
                  <option key={c.idCita} value={c.idCita}>
                    {label}
                  </option>
                );
              })}
            </Select>

            {/* Resumen de la cita seleccionada */}
            <AnimatePresence>
              {citaSel && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                    <User className="h-4 w-4 text-brand-300" />
                    {citaSel.pacienteNombre ?? citaSel.idPaciente}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {citaSel.especialidad}
                    </span>
                    {citaFmt && (
                      <>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span className="capitalize">{citaFmt.fecha}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-brand-300">
                          <Clock className="h-3.5 w-3.5" />
                          {citaFmt.hora}
                        </span>
                      </>
                    )}
                  </div>
                  {coberturaSel && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Cobertura aplicada: {coberturaSel.porcentajeCobertura}%
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Monto total (S/)"
              type="number"
              min="0"
              step="0.01"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="0.00"
            />

            <Select
              label="Cobertura a aplicar"
              value={coberturaId}
              onChange={(e) => setCoberturaId(e.target.value)}
              disabled={!citaSel}
            >
              <option value="">Sin cobertura (copago total)</option>
              {coberturasPaciente.map((c) => (
                <option key={c.idValidacion} value={c.idValidacion}>
                  {c.porcentajeCobertura}% — Póliza {c.numeroPoliza ?? c.idValidacion}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Método"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="POS">Tarjeta (POS)</option>
              </Select>
              <Select
                label="Comprobante"
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value as TipoComprobante)}
              >
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura</option>
              </Select>
            </div>

            {/* Campo DNI (Boleta) o RUC (Factura) */}
            <AnimatePresence mode="wait">
              {tipoComprobante === 'BOLETA' ? (
                <motion.div
                  key="dni"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="DNI del titular (opcional)"
                    placeholder="12345678"
                    maxLength={8}
                    value={dniTitular}
                    onChange={(e) => setDniTitular(e.target.value.replace(/\D/g, ''))}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="ruc"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="RUC de la empresa"
                    placeholder="20123456789"
                    maxLength={11}
                    value={rucEmpresa}
                    onChange={(e) => setRucEmpresa(e.target.value.replace(/\D/g, ''))}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              className="w-full"
              disabled={!canSubmit}
              loading={confirmar.isPending}
              onClick={() => confirmar.mutate()}
            >
              Confirmar pago
            </Button>
          </CardBody>
        </Card>

        {/* ── Desglose + recientes ── */}
        <div className="space-y-5 lg:col-span-3">
          {/* Desglose */}
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
                  <span className="font-display text-2xl font-bold text-ink-100">
                    {fmtMoney(copago)}
                  </span>
                </div>
                {tipoComprobante === 'BOLETA' && dniTitular && (
                  <p className="text-xs text-ink-500">Boleta a DNI {dniTitular}</p>
                )}
                {tipoComprobante === 'FACTURA' && rucEmpresa && (
                  <p className="text-xs text-ink-500">Factura a RUC {rucEmpresa}</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Pagos recientes */}
          <Card>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-100">Pagos recientes</h3>
            </div>
            {pagos.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Sin pagos"
                description="Los pagos registrados aparecerán aquí."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {pagos.slice(0, 6).map((p) => (
                  <motion.li
                    key={p.idPago}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-100">
                          {p.pacienteNombre ?? p.idCita}
                        </p>
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

      {/* Modal reversar */}
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
            <Button
              variant="danger"
              loading={reversar.isPending}
              disabled={!motivo.trim()}
              onClick={() => reversar.mutate()}
            >
              Reversar
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-300">El motivo de reversión es obligatorio.</p>
        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la reversión…"
        />
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
