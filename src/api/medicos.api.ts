import { http } from './http';
import type { BloqueoAgendaInput, CrearMedicoInput, HorarioBase, Medico } from '@/types';

export const medicosApi = {
  list: () => http.get<{ data: Medico[] }>('/medicos').then((r) => r.data.data),

  crear: (body: CrearMedicoInput) =>
    http.post<{ data: Medico }>('/medicos', body).then((r) => r.data.data),

  disponibilidad: (id: string) =>
    http.get<{ data: unknown }>(`/medicos/${id}/disponibilidad`).then((r) => r.data.data),

  registrarHorarios: (id: string, horarios: HorarioBase[]) =>
    http.post<{ mensaje: string }>(`/medicos/${id}/horarios`, { horarios }).then((r) => r.data),

  registrarBloqueo: (id: string, body: BloqueoAgendaInput) =>
    http.post<{ data: unknown }>(`/medicos/${id}/bloqueos`, body).then((r) => r.data.data),
};
