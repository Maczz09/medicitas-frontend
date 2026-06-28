import { http } from './http';
import type { Cita, CitaAdmin, PageMeta, ReprogramarCitaInput, ReservarCitaInput } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const citasApi = {
  list: (params: { page?: number; limit?: number; estado?: string }) =>
    http.get<{ data: CitaAdmin[]; meta: PageMeta }>('/citas', { params }).then((r) => r.data),

  reservar: (body: ReservarCitaInput, idempotencyKey?: string) =>
    http.post<Cita>('/citas', body, idemHeaders(idempotencyKey)).then((r) => r.data),

  getById: (id: string) => http.get<Cita>(`/citas/${id}`).then((r) => r.data),

  cancelar: (id: string, motivo?: string) =>
    http.patch<Cita>(`/citas/${id}/cancelar`, { motivo }).then((r) => r.data),

  reprogramar: (id: string, body: ReprogramarCitaInput) =>
    http.patch<Cita>(`/citas/${id}/reprogramar`, body).then((r) => r.data),

  registrarIngreso: (id: string) =>
    http.post<Cita>(`/citas/${id}/ingreso`).then((r) => r.data),

  revertirIngreso: (id: string) =>
    http.patch<Cita>(`/citas/${id}/revertir-ingreso`).then((r) => r.data),

  completar: (id: string) =>
    http.patch<Cita>(`/citas/${id}/completar`).then((r) => r.data),
};
