import { http } from './http';
import type { Cita, ReprogramarCitaInput, ReservarCitaInput } from '@/types';

function idemHeaders(key?: string) {
  return key ? { headers: { 'Idempotency-Key': key } } : undefined;
}

export const citasApi = {
  reservar: (body: ReservarCitaInput, idempotencyKey?: string) =>
    http.post<Cita>('/citas', body, idemHeaders(idempotencyKey)).then((r) => r.data),

  getById: (id: string) => http.get<Cita>(`/citas/${id}`).then((r) => r.data),

  cancelar: (id: string, motivo?: string) =>
    http.patch<Cita>(`/citas/${id}/cancelar`, { motivo }).then((r) => r.data),

  reprogramar: (id: string, body: ReprogramarCitaInput) =>
    http.patch<Cita>(`/citas/${id}/reprogramar`, body).then((r) => r.data),

  registrarIngreso: (id: string) =>
    http.post<Cita>(`/citas/${id}/ingreso`).then((r) => r.data),
};
