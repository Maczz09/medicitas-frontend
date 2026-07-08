export interface Medico {
  id_medico: string;
  nombre: string;
  apellido: string;
  cmp: string;
  especialidad: string;
  activo?: number | boolean;
}

// Crear médico = crea el registro de médico Y su cuenta de acceso (rol Médico)
// vinculada por id_medico. email + password generan el usuario para login.
export interface CrearMedicoInput {
  cmp: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  email: string;
  password: string;
}

/** Una franja de horario base semanal del médico. */
export interface HorarioBase {
  dia_semana: number; // 0=Dom ... 6=Sab
  hora_inicio: string; // "08:00"
  hora_fin: string; // "13:00"
  duracion_cita_min: number;
}

/** Un día dentro de la respuesta de horario de una semana específica. */
export interface HorarioSemanaDia extends HorarioBase {
  activo: boolean;
}

/** Respuesta de GET /medicos/:id/horarios/semanas/:semanaInicio. */
export interface HorarioSemanaResponse {
  semanaInicio: string; // YYYY-MM-DD, lunes
  origen: 'PLANTILLA' | 'SEMANA'; // PLANTILLA = fallback, sin override explícito para esta semana
  dias: HorarioSemanaDia[];
}

export interface BloqueoAgendaInput {
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

/** Edición de un médico (todos los campos). */
export interface ActualizarMedicoInput {
  nombre?: string;
  apellido?: string;
  cmp?: string;
  especialidad?: string;
  activo?: boolean;
}
