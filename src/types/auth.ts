export type Role = 'Recepcionista' | 'Médico' | 'Auditor';

/** Payload real del JWT emitido por el backend (auth.usecases). */
export interface JwtPayload {
  idUsuario: string;
  email: string;
  nombre: string; // "Ana García" (nombre + apellido juntos)
  idRol: number;
  idMedico?: string | null; // vínculo con su registro de médico (si aplica)
  rolNombre: Role;
  iat: number;
  exp: number;
}

/** Usuario derivado del JWT para uso en la UI. */
export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  idRol: number;
  idMedico: string | null;
  rol: Role;
}

/** Fila de usuario para la vista de administración (GET /auth/usuarios). */
export interface UsuarioAdmin {
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: number;
  rolNombre: Role;
  id_medico: string | null;
  activo: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  rol: Role;
  correlationId?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  correlationId?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rolNombre: Role;
}
