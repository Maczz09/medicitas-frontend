import { http } from './http';
import type { NotificacionAdmin, PageMeta } from '@/types';

export const notificacionesApi = {
  list: (params: { page?: number; limit?: number; estado?: string; q?: string; idPaciente?: string }) =>
    http
      .get<{ data: NotificacionAdmin[]; meta: PageMeta }>('/notificaciones', { params })
      .then((r) => r.data),
};
