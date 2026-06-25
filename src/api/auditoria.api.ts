import { http } from './http';
import type { ConsultarTrazasParams, Traza, TrazasResponse } from '@/types';

export const auditoriaApi = {
  trazas: (params: ConsultarTrazasParams) =>
    http.get<TrazasResponse>('/auditoria/trazas', { params }).then((r) => r.data),

  /** Reconstruye el flujo completo de una operación por correlationId. */
  correlacion: (correlationId: string) =>
    http.get<Traza[] | { trazas: Traza[] }>(`/auditoria/correlacion/${correlationId}`).then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.trazas ?? []);
    }),
};
