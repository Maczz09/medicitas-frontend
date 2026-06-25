export type EstadoCita =
  | 'Pendiente'
  | 'En_Atencion'
  | 'Completada'
  | 'Cancelada'
  | 'No_Asistida';

/** Respuesta de Consultar/Reservar cita (camelCase, fechas en ISO). */
export interface Cita {
  idCita: string;
  idPaciente: string;
  idMedico: string;
  fechaHora: string;
  especialidad: string;
  estado: EstadoCita;
  mensaje?: string;
  correlationId?: string;
}

export interface ReservarCitaInput {
  idPaciente: string;
  idMedico: string;
  fechaHora: string;
  especialidad: string;
}

export interface ReprogramarCitaInput {
  nuevaFechaHora: string;
  idMedico?: string;
}
