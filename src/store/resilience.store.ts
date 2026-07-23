import { create } from 'zustand';

interface ResilienceState {
  // Clave = nombreTecnico (único por contrato de circuitBreaker.js), no el
  // nombre legible — dos breakers distintos pueden apuntar al mismo servicio
  // (ej. 'Pagos→Citas:consultar' y 'Pagos→Citas:cancelar' ambos → 'Citas').
  // Si la clave fuera el nombre legible, cerrar uno borraría la entrada del
  // otro que sigue abierto.
  circuitosAbiertos: Record<string, string>; // nombreTecnico -> servicio
  serviciosDeshabilitados: Set<string>;
  marcarCircuitoAbierto: (nombreTecnico: string, servicio: string) => void;
  marcarCircuitoCerrado: (nombreTecnico: string) => void;
  marcarServicioDeshabilitado: (servicio: string) => void;
  marcarServicioHabilitado: (servicio: string) => void;
}

export const useResilienceStore = create<ResilienceState>()((set) => ({
  circuitosAbiertos: {},
  serviciosDeshabilitados: new Set(),

  marcarCircuitoAbierto: (nombreTecnico, servicio) =>
    set((s) => ({ circuitosAbiertos: { ...s.circuitosAbiertos, [nombreTecnico]: servicio } })),

  marcarCircuitoCerrado: (nombreTecnico) =>
    set((s) => {
      const { [nombreTecnico]: _quitado, ...resto } = s.circuitosAbiertos;
      return { circuitosAbiertos: resto };
    }),

  marcarServicioDeshabilitado: (servicio) =>
    set((s) => ({ serviciosDeshabilitados: new Set(s.serviciosDeshabilitados).add(servicio) })),

  marcarServicioHabilitado: (servicio) =>
    set((s) => {
      const nuevo = new Set(s.serviciosDeshabilitados);
      nuevo.delete(servicio);
      return { serviciosDeshabilitados: nuevo };
    }),
}));
