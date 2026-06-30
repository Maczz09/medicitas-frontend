import { http } from './http';
import type {
  ActualizarMedicoInput,
  BloqueoAgendaInput,
  CrearMedicoInput,
  HorarioBase,
  Medico,
} from '@/types';

export const medicosApi = {
  list: () => http.get<{ data: Medico[] }>('/medicos').then((r) => r.data.data),

  getById: (id: string) => http.get<{ data: Medico }>(`/medicos/${id}`).then((r) => r.data.data),

  crear: (body: CrearMedicoInput) =>
    http.post<{ data: Medico }>('/medicos', body).then((r) => r.data.data),

  update: (id: string, body: ActualizarMedicoInput) =>
    http.put<{ data: Medico }>(`/medicos/${id}`, body).then((r) => r.data.data),

  disponibilidad: (id: string) =>
    http.get<{ data: unknown }>(`/medicos/${id}/disponibilidad`).then((r) => r.data.data),

  registrarHorarios: (id: string, horarios: HorarioBase[]) =>
    http.post<{ mensaje: string }>(`/medicos/${id}/horarios`, { horarios }).then((r) => r.data),

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
