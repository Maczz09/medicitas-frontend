import { http } from './http';
import type {
  CrearExpedienteInput,
  HistoricoEncuentros,
  RegistrarEncuentroInput,
  ResultadoEncuentro,
  ResumenClinico,
} from '@/types';

export const hclApi = {
  crearExpediente: (body: CrearExpedienteInput) =>
    http
      .post<{ data: { id: string; idPaciente: string }; yaExistia?: boolean }>(
        '/historias-clinicas/expedientes',
        body,
      )
      .then((r) => r.data),

  registrarEncuentro: (idPaciente: string, body: RegistrarEncuentroInput) =>
    http
      .post<ResultadoEncuentro>(`/historias-clinicas/${idPaciente}/encuentros`, body)
      .then((r) => r.data),

  resumen: (idPaciente: string) =>
    http.get<ResumenClinico>(`/historias-clinicas/${idPaciente}/resumen`).then((r) => r.data),

  encuentros: (idPaciente: string, params: { pagina?: number; porPagina?: number }) =>
    http
      .get<HistoricoEncuentros>(`/historias-clinicas/${idPaciente}/encuentros`, { params })
      .then((r) => r.data),
};
