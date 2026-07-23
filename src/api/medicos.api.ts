import { http } from './http';
import type {
  ActualizarMedicoInput,
  BloqueoAgendaInput,
  CrearMedicoInput,
  HorarioBase,
  HorarioSemanaResponse,
  Medico,
  PageMeta,
} from '@/types';

export const medicosApi = {
  list: () => http.get<{ data: Medico[] }>('/medicos').then((r) => r.data.data),

  // Distinto de list(): con page/limit/q, el backend pagina y busca por texto
  // libre (nombre/apellido/cmp/especialidad) en vez de devolver el catálogo
  // completo. list()/useMedicos() no se tocan — 4 pantallas dependen de traer
  // todos los médicos de una vez.
  search: (params: { page?: number; limit?: number; q?: string }) =>
    http.get<{ data: Medico[]; meta: PageMeta }>('/medicos', { params }).then((r) => r.data),

  getById: (id: string) => http.get<{ data: Medico }>(`/medicos/${id}`).then((r) => r.data.data),

  crear: (body: CrearMedicoInput) =>
    http.post<{ data: Medico }>('/medicos', body).then((r) => r.data.data),

  update: (id: string, body: ActualizarMedicoInput) =>
    http.put<{ data: Medico }>(`/medicos/${id}`, body).then((r) => r.data.data),

  disponibilidad: (id: string) =>
    http.get<{ data: unknown }>(`/medicos/${id}/disponibilidad`).then((r) => r.data.data),

  registrarHorarios: (id: string, horarios: HorarioBase[]) =>
    http.post<{ mensaje: string }>(`/medicos/${id}/horarios`, { horarios }).then((r) => r.data),

  consultarHorarioSemana: (id: string, semanaInicio: string) =>
    http.get<{ data: HorarioSemanaResponse }>(`/medicos/${id}/horarios/semanas/${semanaInicio}`).then((r) => r.data.data),

  definirHorarioSemana: (id: string, semanaInicio: string, dias: HorarioBase[]) =>
    http.put<{ mensaje: string }>(`/medicos/${id}/horarios/semanas/${semanaInicio}`, { dias }).then((r) => r.data),

  registrarBloqueo: (id: string, body: BloqueoAgendaInput) =>
    http.post<{ data: unknown }>(`/medicos/${id}/bloqueos`, body).then((r) => r.data.data),

  slots: (id: string, fecha: string) =>
    http.get<{ data: SlotsResponse }>(`/medicos/${id}/slots`, { params: { fecha } }).then((r) => r.data.data),
};

export interface SlotInfo {
  hora: string;
  fechaHora: string;
  estado: 'libre' | 'ocupado' | 'bloqueado';
  motivoBloqueo: string | null;
  paciente: string | null;
}

export interface SlotsResponse {
  fecha: string;
  diaSemana: number;
  tieneHorario: boolean;
  horario: { hora_inicio: string; hora_fin: string; duracion_cita_min: number } | null;
  bloqueos: { id_bloqueo: string; fecha_inicio: string; fecha_fin: string; motivo: string }[];
  slots: SlotInfo[];
}
