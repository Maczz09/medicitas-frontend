import { http } from './http';

export const adminApi = {
  /** Estado habilitado/deshabilitado de los módulos togglea­bles (kill-switch de demo). */
  servicios: () =>
    http.get<{ data: Record<string, boolean> }>('/admin/servicios').then((r) => r.data.data),

  /** Habilita/deshabilita un módulo — simula su caída dentro del monolito. */
  toggleServicio: (nombre: string, habilitado: boolean) =>
    http.patch<{ data: { nombre: string; habilitado: boolean } }>(`/admin/servicios/${nombre}`, { habilitado })
      .then((r) => r.data.data),

  /** Circuit breakers abiertos ahora mismo — snapshot para sincronizar el banner al cargar/recargar. */
  circuitos: () =>
    http.get<{ data: { nombreTecnico: string; servicio: string }[] }>('/admin/circuitos').then((r) => r.data.data),
};
