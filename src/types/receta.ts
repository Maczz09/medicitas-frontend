export type EstadoReceta =
  | 'CREADA'
  | 'ENVIADA_A_FARMACIA'
  | 'DESPACHADA'
  | 'RECHAZADA_POR_STOCK'
  | 'RECHAZADA_POR_VALIDACION'
  | 'RETIRADA';

/** Respuesta de GET /prescripciones/:id (estado del despacho de receta). */
export interface Receta {
  id: string;
  idPrescripcionClinica?: string;
  idEncuentroClinico?: string;
  idPaciente?: string;
  idFarmacia?: string;
  estado: EstadoReceta;
  contenido?: {
    medicamento?: string;
    dosis?: string;
    frecuencia?: string;
    cantidad?: number;
    duracion?: string;
    indicaciones?: string;
  } | null;
  referenciaFarmacia?: string | null;
  observacionFarmacia?: string | null;
  motivoRechazo?: string | null;
  intentosEnvio?: number;
  correlationId?: string;
}

/** Respuesta de GET /prescripciones/:id/detalle — receta con médico, cita y farmacia. */
export interface RecetaDetalle {
  idReceta: string;
  estado: EstadoReceta;
  contenido: {
    medicamento?: string;
    dosis?: string;
    frecuencia?: string;
    cantidad?: number;
    duracion?: string;
    indicaciones?: string;
  } | null;
  fechaEmision: string;
  fechaDespacho: string | null;
  fechaRetiro: string | null;
  referenciaFarmacia: string | null;
  observacionFarmacia: string | null;
  motivoRechazo: string | null;
  intentosEnvio: number;
  correlationId: string | null;
  farmacia: { id: string };
  paciente: {
    id: string;
    nombre: string | null;
    tipoDocumento: string | null;
    numeroDocumento: string | null;
    telefono: string | null;
  };
  medico: {
    id: string;
    nombre: string | null;
    cmp: string | null;
    especialidad: string | null;
  } | null;
  cita: {
    id: string;
    fechaHora: string;
    especialidad: string;
    estado: string;
  } | null;
  encuentro: {
    id: string;
    fechaHora: string;
    diagnosticoCie10: string | null;
    diagnosticoDescripcion: string | null;
  } | null;
  recetaPDF: {
    id: string;
    esContingencia: boolean;
    urlDescarga: string;
    generadaEn: string;
  } | null;
}
