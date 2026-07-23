import { http } from './http';
import type { CoberturaAdmin, PageMeta, ResultadoCobertura, ValidarCoberturaInput } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const coberturasApi = {
  list: (params: { page?: number; limit?: number; estado?: string; q?: string; idPaciente?: string }) =>
    http.get<{ data: CoberturaAdmin[]; meta: PageMeta }>('/coberturas', { params }).then((r) => r.data),

  validar: (body: ValidarCoberturaInput, idempotencyKey?: string) =>
    http.post<ResultadoCobertura>('/coberturas/validar', body, idemHeaders(idempotencyKey))
      .then((r) => r.data),

  getById: (id: string) =>
    http.get<ResultadoCobertura>(`/coberturas/${id}`).then((r) => r.data),
};
