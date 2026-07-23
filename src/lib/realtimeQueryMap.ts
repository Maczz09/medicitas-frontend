import { queryKeys } from './queryKeys';

type QueryKeyPrefix = readonly unknown[];

// Qué queries invalidar por cada tipo de evento de dominio, para reemplazar
// el queryClient.invalidateQueries() ciego de antes (invalidaba TODO en cada
// mensaje). useServerSync.ts (CitasPage/PagosPage de recepcionista) mantiene
// sus propias keys — hay que incluirlas aquí o esas 2 páginas dejan de
// actualizarse en vivo, aunque no formen parte del retrofit de búsqueda.
export const REALTIME_QUERY_MAP: Record<string, QueryKeyPrefix[]> = {
  // Citas
  CitaReservada: [queryKeys.citas.all, ['server-sync-citas']],
  CitaCreada: [queryKeys.citas.all, ['server-sync-citas']],
  CitaCancelada: [queryKeys.citas.all, ['server-sync-citas']],
  CitaReprogramada: [queryKeys.citas.all, ['server-sync-citas']],
  CitaExpirada: [queryKeys.citas.all, ['server-sync-citas']],
  IngresoRegistrado: [queryKeys.citas.all, ['server-sync-citas']],
  IngresoRevertido: [queryKeys.citas.all, ['server-sync-citas']],
  // Reconciliación de pago tras recuperarse Pagos — mismo prefijo que
  // AdminCitasPage.tsx (Auditor), donde vive el indicador de verificación.
  IngresoPagoVerificado: [queryKeys.citas.all, ['server-sync-citas']],
  IngresoPagoInconsistente: [queryKeys.citas.all, ['server-sync-citas']],
  IntentoReserva: [queryKeys.citas.all],

  // Pagos — también afectan citas (el estado "pagada" se refleja ahí)
  PagoConfirmado: [queryKeys.pagos.all, ['server-sync-pagos'], ['server-sync-citas']],
  PagoAprobado: [queryKeys.pagos.all, ['server-sync-pagos'], ['server-sync-citas']],
  PagoReversado: [queryKeys.pagos.all, ['server-sync-pagos'], ['server-sync-citas']],
  // Reconciliación de cobertura tras recuperarse Seguros — mismo prefijo que
  // AdminPagosPage.tsx (Auditor), donde vive el indicador de verificación.
  PagoCoberturaVerificada: [queryKeys.pagos.all],
  PagoCoberturaInconsistente: [queryKeys.pagos.all],

  // Coberturas
  CoberturaValidada: [queryKeys.coberturas.all],
  CoberturaRechazada: [queryKeys.coberturas.all],
  CoberturaPendiente: [queryKeys.coberturas.all],

  // Pacientes
  PacienteRegistrado: [['pacientes']],
  PacienteActualizado: [['pacientes']],
  DatosContactoActualizados: [['pacientes']],
  EstadoPacienteActualizado: [['pacientes']],

  // Facturación — un comprobante nuevo cuelga de un pago existente
  ComprobanteGenerado: [queryKeys.pagos.all],
  ComprobanteEmitido: [queryKeys.pagos.all],
  // Reconciliación de nombre tras recuperarse Pacientes — mismo prefijo,
  // el comprobante se consulta colgado del pago.
  ComprobanteNombreVerificado: [queryKeys.pagos.all],

  // Historia clínica
  ExpedienteCreado: [['hcl-resumen'], ['hcl-encuentros']],
  EncuentroRegistrado: [['hcl-resumen'], ['hcl-encuentros']],
  EncuentroClinicoRegistrado: [['hcl-resumen'], ['hcl-encuentros']],
  PrescripcionEmitida: [queryKeys.prescripciones.all],
  // Reconciliación de "completar cita" tras recuperarse Citas.
  CitaCompletadaReconciliada: [['hcl-resumen'], ['hcl-encuentros']],
  CitaCompletadaInconsistente: [['hcl-resumen'], ['hcl-encuentros']],

  // Recetas/prescripciones — ['receta-detalle'] en los 6 (no solo en
  // RecetaPDFDisponible como antes): es el prefijo de RecetaDetalleModal.tsx,
  // usado desde recepción/auditor/impresión. Sin él, alguien con el modal de
  // detalle abierto no veía un despacho/rechazo/reintento hecho en paralelo
  // (aunque la tabla de la lista, bajo prescripciones.all, sí se refrescaba).
  RecetaEmitida: [queryKeys.prescripciones.all, ['receta-detalle']],
  RecetaRetirada: [queryKeys.prescripciones.all, ['receta-detalle']],
  RecetaRechazada: [queryKeys.prescripciones.all, ['receta-detalle']],
  RecetaDespachada: [queryKeys.prescripciones.all, ['receta-detalle']],
  RecetaContingenciaGenerada: [queryKeys.prescripciones.all, ['receta-detalle']],
  RecetaPDFDisponible: [queryKeys.prescripciones.all, ['receta-detalle']],

  // Médicos/horarios
  MedicoActualizado: [queryKeys.medicos.all],
  BloqueoRegistrado: [['disponibilidad'], ['medico-slots']],
  PlantillaHorarioActualizada: [['disponibilidad']],
  HorarioSemanaDefinido: [['horario-semana']],

  // Usuarios
  UsuarioRegistrado: [['usuarios']],
  UsuarioActualizado: [['usuarios']],
  // Puramente de auditoría — ninguna lista necesita refrescarse porque
  // alguien inició sesión. Array vacío = evento reconocido, nada que invalidar
  // (distinto de "no mapeado", que cae al fallback de invalidar todo).
  UsuarioLoggedIn: [],

  // Notificaciones
  SMSEnviado: [queryKeys.notificaciones.all],
};
