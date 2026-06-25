import { http } from './http';
import type { ResultadoCobertura, ValidarCoberturaInput } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const coberturasApi = {
  validar: (body: ValidarCoberturaInput, idempotencyKey?: string) =>
    http.post<ResultadoCobertura>('/coberturas/validar', body, idemHeaders(idempotencyKey))
      .then((r) => r.data),

  getById: (id: string) =>
    http.get<ResultadoCobertura>(`/coberturas/${id}`).then((r) => r.data),
};
