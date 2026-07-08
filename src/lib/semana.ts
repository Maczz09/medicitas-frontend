// Helpers de "semana" para el navegador de AgendaPage.tsx — mismo criterio
// que SemanaISO en el backend (src/modules/horarios/domain/value-objects/SemanaISO.js):
// SIEMPRE fecha LOCAL, nunca toISOString().split('T')[0] (eso desplaza por
// el offset UTC-5 de Lima cerca de medianoche).

function aFechaLocal(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00`);
}

function formatoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Lunes (YYYY-MM-DD, fecha local) de la semana que contiene `fechaISO`. */
export function lunesDeLaSemana(fechaISO: string): string {
  const d = aFechaLocal(fechaISO);
  const diaSemana = d.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  const offsetHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetHastaLunes);
  return formatoLocal(lunes);
}

/** Suma (o resta, si es negativo) días a una fecha YYYY-MM-DD, en local. */
export function sumarDias(fechaISO: string, dias: number): string {
  const d = aFechaLocal(fechaISO);
  const resultado = new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);
  return formatoLocal(resultado);
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "6-12 jul" (o "30 jun-6 jul" si la semana cruza de mes) a partir del lunes. */
export function formatoRangoSemana(lunesISO: string): string {
  const lunes = aFechaLocal(lunesISO);
  const domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);

  const diaL = lunes.getDate();
  const diaD = domingo.getDate();
  const mesL = MESES_CORTOS[lunes.getMonth()];
  const mesD = MESES_CORTOS[domingo.getMonth()];

  return mesL === mesD ? `${diaL}-${diaD} ${mesL}` : `${diaL} ${mesL} - ${diaD} ${mesD}`;
}
