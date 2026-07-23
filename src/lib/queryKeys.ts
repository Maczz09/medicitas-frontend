// Prefijos únicos por entidad para que TanStack Query invalide por prefijo
// (invalidateQueries({queryKey:['citas']}) matchea cualquier variante que
// empiece con 'citas') y para que vistas distintas de la MISMA entidad
// compartan cache en vez de keys ad-hoc sin relación entre sí.
export const queryKeys = {
  citas: {
    all: ['citas'] as const,
    admin: (page: number, estado: string, q: string, idPaciente?: string) =>
      ['citas', 'admin', page, estado, q, idPaciente] as const,
  },
  pagos: {
    all: ['pagos'] as const,
    admin: (page: number, q: string, idPaciente?: string) =>
      ['pagos', 'admin', page, q, idPaciente] as const,
  },
  coberturas: {
    all: ['coberturas'] as const,
    admin: (page: number, estado: string, q: string, idPaciente?: string) =>
      ['coberturas', 'admin', page, estado, q, idPaciente] as const,
  },
  prescripciones: {
    all: ['prescripciones'] as const,
    // Compartida entre AdminPrescripcionesPage y RecetasPage (misma entidad,
    // antes con keys distintas que no compartían cache).
    lista: (page: number, estado: string, soloContingencia: boolean, q: string, idPaciente?: string) =>
      ['prescripciones', page, estado, soloContingencia, q, idPaciente] as const,
  },
  notificaciones: {
    all: ['notificaciones'] as const,
    admin: (page: number, estado: string, q: string, idPaciente?: string) =>
      ['notificaciones', 'admin', page, estado, q, idPaciente] as const,
  },
  medicos: {
    // Usada por useMedicos() (lista completa, sin filtros) — no se toca.
    all: ['medicos'] as const,
    admin: (page: number, q: string) => ['medicos', 'admin', page, q] as const,
  },
};
