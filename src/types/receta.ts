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
