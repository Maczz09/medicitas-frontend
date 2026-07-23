import { http } from './http';
import type { ConfirmarPagoInput, Pago, PagoAdmin, PageMeta } from '@/types';

export const pagosApi = {
  list: (params: { page?: number; limit?: number; estado?: string; q?: string; idPaciente?: string }) =>
    http.get<{ data: PagoAdmin[]; meta: PageMeta }>('/pagos', { params }).then((r) => r.data),

  // Idempotency-Key SIEMPRE presente: confirmar un pago es una operación con
  // dinero — si el usuario hace doble clic o hay un reintento de red, el
  // backend deduplica por esta clave y no cobra dos veces.
  confirmar: (body: ConfirmarPagoInput) =>
    http.post<Pago>('/pagos', body, { headers: { 'Idempotency-Key': crypto.randomUUID() } }).then((r) => r.data),

  getById: (id: string) => http.get<Pago>(`/pagos/${id}`).then((r) => r.data),

  getByCita: (idCita: string) =>
    http.get<Pago>(`/pagos/cita/${idCita}`).then((r) => r.data),

  reversar: (id: string, motivo: string) =>
    http.post<Pago>(`/pagos/${id}/reversar`, { motivo }).then((r) => r.data),
};
