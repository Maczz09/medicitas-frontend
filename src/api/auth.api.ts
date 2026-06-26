import { http } from './http';
import type { LoginRequest, LoginResponse, PageMeta, RegisterRequest, Role, UsuarioAdmin } from '@/types';

export const authApi = {
  login: (body: LoginRequest) =>
    http.post<LoginResponse>('/auth/login', body).then((r) => r.data),

  listUsuarios: (params: { q?: string; page?: number; limit?: number }) =>
    http
      .get<{ data: UsuarioAdmin[]; meta: PageMeta }>('/auth/usuarios', { params })
      .then((r) => r.data),

  updateUsuario: (
    id: string,
    body: Partial<{ nombre: string; apellido: string; email: string; rolNombre: Role; activo: boolean }>,
  ) => http.put<{ data: UsuarioAdmin }>(`/auth/usuarios/${id}`, body).then((r) => r.data.data),

  forgotPassword: (email: string) =>
    http.post<{ mensaje: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (body: { email: string; otpCode: string; newPassword: string }) =>
    http.post<{ mensaje: string }>('/auth/reset-password', body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    http.post<{ data: { id: string; email: string; rol: Role } }>('/auth/register', body)
      .then((r) => r.data.data),

  assignRole: (idUsuario: string, rolNombre: Role) =>
    http.put<{ data: { id: string; nuevoRol: Role } }>(`/auth/usuarios/${idUsuario}/rol`, {
      rolNombre,
    }).then((r) => r.data.data),
};
