import { http } from './http';
import type { ConfirmarPagoInput, Pago } from '@/types';

export const pagosApi = {
  confirmar: (body: ConfirmarPagoInput) =>
    http.post<Pago>('/pagos', body).then((r) => r.data),

  getById: (id: string) => http.get<Pago>(`/pagos/${id}`).then((r) => r.data),

  getByCita: (idCita: string) =>
    http.get<Pago>(`/pagos/cita/${idCita}`).then((r) => r.data),

  reversar: (id: string, motivo: string) =>
    http.post<Pago>(`/pagos/${id}/reversar`, { motivo }).then((r) => r.data),
};
