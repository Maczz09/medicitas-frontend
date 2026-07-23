import { http } from './http';
import type { DespachoAdmin, PageMeta, Receta, RecetaDetalle } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const prescripcionesApi = {
  list: (params: { page?: number; limit?: number; estado?: string; contingencia?: boolean; q?: string; idPaciente?: string }) =>
    http.get<{ data: DespachoAdmin[]; meta: PageMeta }>('/prescripciones', { params }).then((r) => r.data),

  getById: (id: string) => http.get<Receta>(`/prescripciones/${id}`).then((r) => r.data),

  getDetalle: (id: string) =>
    http.get<{ data: RecetaDetalle }>(`/prescripciones/${id}/detalle`).then((r) => r.data.data),

  reintentar: (id: string, idempotencyKey?: string) =>
    http.post<Receta & { mensaje?: string }>(
      `/prescripciones/${id}/reintentar`,
      {},
      idemHeaders(idempotencyKey),
    ).then((r) => r.data),

  marcarRetirada: (id: string, idempotencyKey?: string) =>
    http.patch<Receta & { mensaje?: string }>(
      `/prescripciones/${id}/retirada`,
      {},
      idemHeaders(idempotencyKey),
    ).then((r) => r.data),
};
