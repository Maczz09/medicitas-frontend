import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/auth.store';
import type { ApiErrorBody, RefreshResponse } from '@/types';

export const API_URL = import.meta.env.VITE_API_URL || '/api/v2';

export const http = axios.create({ baseURL: API_URL });

// ── Request: adjunta el access token ────────────────────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: en 401 intenta refresh una sola vez y reencola peticiones ──────
let isRefreshing = false;
let waiters: Array<(token: string | null) => void> = [];

function flushWaiters(token: string | null) {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // No reintentar el propio refresh ni peticiones ya reintentadas
    const isAuthCall = original?.url?.includes('/auth/');
    if (status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    const { refreshToken, updateTokens } = useAuthStore.getState();
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Esperar a que termine el refresh en curso
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error);
          original._retry = true;
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          resolve(http(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post<RefreshResponse>(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      updateTokens(data.accessToken, data.refreshToken);
      flushWaiters(data.accessToken);
      original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
      return http(original);
    } catch (refreshErr) {
      flushWaiters(null);
      forceLogout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Traduce mensajes de red de axios al español. */
function traducirErrorRed(msg: string): string {
  if (!msg) return msg;
  if (msg === 'Network Error' || msg.toLowerCase().includes('network error'))
    return 'Sin conexión con el servidor. Verifica tu red.';
  if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('time out'))
    return 'La solicitud tardó demasiado. Inténtalo de nuevo.';
  if (msg.toLowerCase().includes('status code 401'))
    return 'Sesión expirada. Inicia sesión de nuevo.';
  if (msg.toLowerCase().includes('status code 403'))
    return 'No tienes permiso para realizar esta acción.';
  if (msg.toLowerCase().includes('status code 404'))
    return 'El recurso solicitado no fue encontrado.';
  if (msg.toLowerCase().includes('status code 5'))
    return 'Error interno del servidor. Contacta al administrador.';
  if (msg.toLowerCase().includes('status code'))
    return 'Error de comunicación con el servidor.';
  return msg;
}

/** Extrae un mensaje legible de cualquier error de API. */
export function apiError(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    // El backend siempre devuelve { mensaje, codigo } en español; priorizamos mensaje.
    if (body?.mensaje) return body.mensaje;
    if (body?.codigo && body.codigo !== 'ERROR_INTERNO') return body.codigo;
    // Si no hay cuerpo de respuesta (timeout, sin conexión, CORS, etc.) traducimos.
    return traducirErrorRed(error.message) || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
