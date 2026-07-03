import { http } from './http';
import type { ConsultarTrazasParams, Traza, TrazasResponse } from '@/types';

export const auditoriaApi = {
  trazas: (params: ConsultarTrazasParams) =>
    http.get<TrazasResponse>('/auditoria/trazas', { params }).then((r) => r.data),

  /** Reconstruye el flujo completo de una operación por correlationId. */
  correlacion: (correlationId: string) =>
    http.get<Traza[] | { trazas?: Traza[]; linea_tiempo?: Traza[] }>(`/auditoria/correlacion/${correlationId}`).then((r) => {
      const d = r.data as any;
      // El backend responde con un array plano; se mantiene compatibilidad con
      // formatos envueltos ({ trazas: [...] } o el legado { linea_tiempo: [...] })
      // por si la respuesta cambia de forma en el futuro.
      if (Array.isArray(d)) return d;
      return d?.trazas ?? d?.linea_tiempo ?? [];
    }),

  health: () =>
    http.get<any>('/auditoria/health').then((r) => r.data),

  unlinkWhatsapp: () =>
    http.post<{ message: string }>('/auditoria/whatsapp/unlink').then((r) => r.data),
};
