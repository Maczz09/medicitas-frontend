export type EstadoCobertura = 'APROBADA' | 'RECHAZADA' | 'PENDIENTE';

export type TipoConsulta =
  | 'CONSULTA_GENERAL'
  | 'CONSULTA_ESPECIALIDAD'
  | 'EMERGENCIA'
  | 'PROCEDIMIENTO';

export interface ValidarCoberturaInput {
  idPaciente: string;
  idAseguradora: string;
  numeroPoliza: string;
  tipoConsulta: TipoConsulta;
}

/** Respuesta de POST /coberturas/validar. */
export interface ResultadoCobertura {
  idValidacion: string;
  estadoCobertura: EstadoCobertura;
  porcentajeCobertura: number;
  codigoAutorizacion: string | null;
  vigencia: string | null;
  esFallback: boolean;
  mensaje?: string;
  correlationId?: string;
}
