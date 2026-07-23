// Nombre legible para cada módulo togglea­ble por el kill-switch
// (GET/PATCH /admin/servicios) — mismo criterio de nombres que ya usa el
// backend en servicioAfectado (shared/resilience/circuitBreaker.js), para
// que "Citas" se lea igual sea por un circuito abierto o por un kill-switch.
export const NOMBRES_MODULOS: Record<string, string> = {
  pacientes: 'Pacientes',
  medicos: 'Médicos',
  citas: 'Citas',
  seguros: 'Coberturas',
  pagos: 'Pagos',
  'historias-clinicas': 'Historias clínicas',
  prescripciones: 'Prescripciones',
  facturacion: 'Facturación',
  notificaciones: 'Notificaciones',
};

export function nombreModuloLegible(nombre: string): string {
  return NOMBRES_MODULOS[nombre] ?? nombre;
}
