import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EstadoCita, EstadoCobertura, EstadoPago, EstadoReceta } from '@/types';

export interface RecentCita {
  idCita: string;
  idPaciente: string;
  idMedico: string;
  fechaHora: string;
  especialidad: string;
  estado: EstadoCita;
  pacienteNombre?: string;
  medicoNombre?: string;
  ts: number;
}

export interface RecentCobertura {
  idValidacion: string;
  idPaciente: string;
  pacienteNombre?: string;
  numeroPoliza?: string;
  estadoCobertura: EstadoCobertura;
  porcentajeCobertura: number;
  codigoAutorizacion: string | null;
  vigencia: string | null;
  esFallback: boolean;
  mensaje?: string;
  ts: number;
}

export interface RecentPago {
  idPago: string;
  idCita: string;
  estado: EstadoPago;
  montoTotal: number;
  montoCopago: number;
  tipoComprobante: string;
  pacienteNombre?: string;
  ts: number;
}

export interface RecentReceta {
  id: string;
  estado: EstadoReceta;
  medicamento?: string;
  pacienteNombre?: string;
  ts: number;
}

const CAP = 40;

function upsert<T>(list: T[], item: T, key: keyof T): T[] {
  const without = list.filter((x) => x[key] !== item[key]);
  return [item, ...without].slice(0, CAP);
}

function patch<T>(list: T[], id: unknown, key: keyof T, p: Partial<T>): T[] {
  return list.map((x) => (x[key] === id ? { ...x, ...p } : x));
}

interface ActivityState {
  citas: RecentCita[];
  coberturas: RecentCobertura[];
  pagos: RecentPago[];
  recetas: RecentReceta[];
  addCita: (c: RecentCita) => void;
  updateCita: (idCita: string, p: Partial<RecentCita>) => void;
  addCobertura: (c: RecentCobertura) => void;
  updateCobertura: (idValidacion: string, p: Partial<RecentCobertura>) => void;
  addPago: (p: RecentPago) => void;
  updatePago: (idPago: string, p: Partial<RecentPago>) => void;
  addReceta: (r: RecentReceta) => void;
  updateReceta: (id: string, p: Partial<RecentReceta>) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      citas: [],
      coberturas: [],
      pagos: [],
      recetas: [],
      addCita: (c) => set((s) => ({ citas: upsert(s.citas, c, 'idCita') })),
      updateCita: (idCita, p) => set((s) => ({ citas: patch(s.citas, idCita, 'idCita', p) })),
      addCobertura: (c) => set((s) => ({ coberturas: upsert(s.coberturas, c, 'idValidacion') })),
      updateCobertura: (idValidacion, p) =>
        set((s) => ({ coberturas: patch(s.coberturas, idValidacion, 'idValidacion', p) })),
      addPago: (p) => set((s) => ({ pagos: upsert(s.pagos, p, 'idPago') })),
      updatePago: (idPago, p) => set((s) => ({ pagos: patch(s.pagos, idPago, 'idPago', p) })),
      addReceta: (r) => set((s) => ({ recetas: upsert(s.recetas, r, 'id') })),
      updateReceta: (id, p) => set((s) => ({ recetas: patch(s.recetas, id, 'id', p) })),
    }),
    { name: 'medicitas-activity' },
  ),
);
