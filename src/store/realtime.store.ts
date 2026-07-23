import { create } from 'zustand';

export type RealtimeStatus = 'conectado' | 'reconectando' | 'desconectado';

interface RealtimeState {
  status: RealtimeStatus;
  setStatus: (status: RealtimeStatus) => void;
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: 'desconectado',
  setStatus: (status) => set({ status }),
}));
