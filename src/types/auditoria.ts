export interface TrazaActor {
  id: string | null;
  nombre: string | null;
  rol: string | null;
}

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
  actor: TrazaActor | null;
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
