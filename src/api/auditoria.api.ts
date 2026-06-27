import { http } from './http';
import type { ConsultarTrazasParams, Traza, TrazasResponse } from '@/types';

export const auditoriaApi = {
  trazas: (params: ConsultarTrazasParams) =>
    http.get<TrazasResponse>('/auditoria/trazas', { params }).then((r) => r.data),

  /** Reconstruye el flujo completo de una operación por correlationId. */
  correlacion: (correlationId: string) =>
    http.get<Traza[] | { trazas?: Traza[]; linea_tiempo?: Traza[] }>(`/auditoria/correlacion/${correlationId}`).then((r) => {
      const d = r.data;
      if (Array.isArray(d)) return d;
      // Soporta tanto { trazas: [...] } como el formato legado { linea_tiempo: [...] }
      return (d.trazas ?? d.linea_tiempo ?? []);
    }),
};
