import { http } from './http';
import type {
  ActualizarContactoInput,
  ActualizarPacienteInput,
  CrearPacienteInput,
  ListarPacientesParams,
  Paciente,
  PageMeta,
} from '@/types';

interface PacientesResponse {
  data: Paciente[];
  meta: PageMeta;
}

export const pacientesApi = {
  list: (params: ListarPacientesParams) =>
    http.get<PacientesResponse>('/pacientes', { params }).then((r) => r.data),

  getById: (id: string) =>
    http.get<{ data: Paciente }>(`/pacientes/${id}`).then((r) => r.data.data),

  create: (body: CrearPacienteInput) =>
    http.post<{ data: Paciente }>('/pacientes', body).then((r) => r.data.data),

  update: (id: string, body: ActualizarPacienteInput) =>
    http.put<{ data: Paciente }>(`/pacientes/${id}`, body).then((r) => r.data.data),

  updateContacto: (id: string, body: ActualizarContactoInput) =>
    http.put<{ mensaje: string }>(`/pacientes/${id}/contacto`, body).then((r) => r.data),

  toggleEstado: (id: string, activo: boolean) =>
    http.patch<{ data: { id_paciente: string; activo: number } }>(`/pacientes/${id}/estado`, {
      activo,
    }).then((r) => r.data.data),
};
