import type { JwtPayload } from '@/types';

/** Decodifica base64url manejando UTF-8 (ej. nombres con acentos: "García"). */
function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64.padEnd(base64.length + pad, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Decodifica el payload del JWT (sin verificar firma — eso lo hace el backend). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(decodeBase64Url(part)) as JwtPayload;
  } catch {
    return null;
  }
}

/** True si el token ya expiró (con margen de 10s). */
export function isTokenExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - 10_000;
}
