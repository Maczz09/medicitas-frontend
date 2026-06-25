/** Genera franjas horarias de 08:00 a 17:30 cada 30 minutos (coincide con la disponibilidad del backend). */
export function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Combina fecha (YYYY-MM-DD) y hora (HH:MM) locales en un ISO string. */
export function combinarFechaHora(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00`).toISOString();
}

/** Fecha de hoy en formato YYYY-MM-DD (para el atributo min de inputs date). */
export function hoyISO(): string {
  return new Date().toISOString().split('T')[0];
}
