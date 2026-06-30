/** Genera franjas horarias de 08:00 a 17:30 cada 30 minutos (coincide con la disponibilidad del backend). */
export function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Combina fecha (YYYY-MM-DD) y hora (HH:MM) en datetime local sin conversión UTC. */
export function combinarFechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00`;
}

/** Fecha de hoy en formato YYYY-MM-DD usando hora local (no UTC). */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
