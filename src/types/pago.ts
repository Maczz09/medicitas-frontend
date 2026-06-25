export type MetodoPago = 'EFECTIVO' | 'POS';
export type TipoComprobante = 'BOLETA' | 'FACTURA';
export type EstadoPago = 'APROBADO' | 'PROCESADO' | 'PENDIENTE' | 'REVERSADO' | 'FALLIDO';

export interface ConfirmarPagoInput {
  idCita: string;
  idPaciente: string;
  metodoPago: MetodoPago;
  montoTotal: number;
  montoCubiertoSeguro: number;
  montoCopago: number;
  tipoComprobante: TipoComprobante;
  idValidacionCobertura?: string | null;
  codigoAutorizacionSeguro?: string | null;
  observaciones?: string | null;
}

/** Respuesta de POST /pagos y GET /pagos/:id. */
export interface Pago {
  idPago: string;
  idCita: string;
  idPaciente?: string;
  estado: EstadoPago;
  metodoPago: MetodoPago;
  montoTotal: number;
  montoCubiertoSeguro: number;
  montoCopago: number;
  tipoComprobante: TipoComprobante;
  numeroComprobante?: string | null;
  mensaje?: string;
  correlationId?: string;
}
