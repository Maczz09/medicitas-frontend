import { http } from './http';
import type { ConfirmarPagoInput, Pago, PagoAdmin, PageMeta } from '@/types';

export const pagosApi = {
  list: (params: { page?: number; limit?: number; estado?: string }) =>
    http.get<{ data: PagoAdmin[]; meta: PageMeta }>('/pagos', { params }).then((r) => r.data),

  confirmar: (body: ConfirmarPagoInput) =>
    http.post<Pago>('/pagos', body).then((r) => r.data),

  getById: (id: string) => http.get<Pago>(`/pagos/${id}`).then((r) => r.data),

  getByCita: (idCita: string) =>
    http.get<Pago>(`/pagos/cita/${idCita}`).then((r) => r.data),

  reversar: (id: string, motivo: string) =>
    http.post<Pago>(`/pagos/${id}/reversar`, { motivo }).then((r) => r.data),
};
