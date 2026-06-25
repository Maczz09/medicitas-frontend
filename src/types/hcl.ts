export interface CrearExpedienteInput {
  idPaciente: string;
  grupoSanguineo?: string;
  alergias?: string[];
}

export interface PrescripcionInput {
  medicamento: string;
  dosis: string;
  indicaciones?: string;
  cantidad?: number;
}

export interface RegistrarEncuentroInput {
  idCita: string;
  diagnosticoCie10: string;
  descripcion?: string;
  prescripciones: PrescripcionInput[];
}

export interface ResultadoEncuentro {
  idEncuentro: string;
  idExpediente: string;
  estado: string;
  prescripcionesGeneradas: number;
  mensaje?: string;
  correlationId?: string;
}

export interface ResumenClinico {
  idExpediente: string;
  idPaciente: string;
  grupoSanguineo?: string | null;
  alergiasConocidas?: string[];
  ultimaAtencion?: {
    idEncuentro: string;
    fecha: string;
    diagnosticoCie10: string;
  } | null;
}

export interface EncuentroHistorico {
  idEncuentro: string;
  idCita: string;
  idMedico: string;
  fecha: string;
  diagnosticoCie10: string;
  descripcion?: string | null;
  prescripciones: {
    id: string;
    medicamento: string;
    dosis: string;
    frecuencia?: string;
    duracion?: string | null;
    indicaciones?: string | null;
  }[];
}

export interface HistoricoEncuentros {
  total: number;
  pagina: number;
  porPagina: number;
  encuentros: EncuentroHistorico[];
}
