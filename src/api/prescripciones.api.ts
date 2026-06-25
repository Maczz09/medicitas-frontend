import { http } from './http';
import type { Receta } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const prescripcionesApi = {
  getById: (id: string) => http.get<Receta>(`/prescripciones/${id}`).then((r) => r.data),

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
