import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwt } from '@/lib/jwt';
import type { AuthUser, LoginResponse } from '@/types';

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const p = decodeJwt(token);
  if (!p) return null;
  // Se decodifica la identidad aunque el token esté expirado;
  // la validez real la resuelve el interceptor 401 → refresh.
  return {
    id: p.idUsuario,
    email: p.email,
    nombre: p.nombre,
    idRol: p.idRol,
    idMedico: p.idMedico ?? null,
    rol: p.rolNombre,
  };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (res: LoginResponse) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: (res) => {
        const user = userFromToken(res.accessToken);
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user,
          isAuthenticated: !!user,
        });
      },
      updateTokens: (accessToken, refreshToken) => {
        const user = userFromToken(accessToken);
        set({ accessToken, refreshToken, user, isAuthenticated: !!user });
      },
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'medicitas-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          state.user = userFromToken(state.accessToken);
          state.isAuthenticated = !!state.user;
        }
      },
    },
  ),
);
