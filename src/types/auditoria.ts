export interface Traza {
  id: string;
  idEvento: string;
  servicioOrigen: string;
  tipoEvento: string;
  routingKey: string | null;
  payload: unknown;
  correlationId: string | null;
  timestampOrigen: string | null;
  recibidoEn: string;
}

export interface TrazasResponse {
  total: number;
  pagina: number;
  porPagina: number;
  trazas: Traza[];
}

export interface ConsultarTrazasParams {
  servicio?: string;
  tipoEvento?: string;
  desde?: string;
  hasta?: string;
  correlationId?: string;
  pagina?: number;
  porPagina?: number;
}
