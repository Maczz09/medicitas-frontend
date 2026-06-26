import type { EstadoCita } from './cita';
import type { EstadoCobertura } from './cobertura';
import type { EstadoReceta } from './receta';

export interface CitaAdmin {
  id: string;
  id_paciente: string;
  id_medico: string;
  fecha_hora: string;
  especialidad: string;
  estado: EstadoCita;
  correlation_id: string | null;
  created_at: string;
  paciente_nombre: string | null;
  medico_nombre: string | null;
}

export interface PagoAdmin {
  id_pago: string;
  id_cita: string;
  id_paciente: string;
  codigo_autorizacion: string | null;
  metodo_pago: string;
  monto_total: string | number;
  monto_cobertura: string | number;
  monto_copago: string | number;
  estado: string;
  tipo_comprobante: string;
  numero_comprobante: string | null;
  created_at: string;
  paciente_nombre: string | null;
}

export interface CoberturaAdmin {
  id: string;
  id_paciente: string;
  id_aseguradora: string;
  numero_poliza: string;
  tipo_consulta: string;
  estado_cobertura: EstadoCobertura;
  porcentaje_cobertura: string | number;
  codigo_autorizacion: string | null;
  vigencia: string | null;
  es_fallback: number;
  correlation_id: string | null;
  created_at: string;
  paciente_nombre: string | null;
}

export interface DespachoAdmin {
  id: string;
  id_paciente: string;
  estado: EstadoReceta;
  contenido: { medicamento?: string; dosis?: string; cantidad?: number } | string | null;
  referencia_farmacia: string | null;
  motivo_rechazo: string | null;
  intentos_envio: number;
  correlation_id: string | null;
  fecha_emision: string;
  created_at: string;
  paciente_nombre: string | null;
}

export interface NotificacionAdmin {
  id_mensaje: string;
  id_evento_origen: string;
  tipo_evento: string;
  telefono_destino: string;
  contenido: string;
  estado: string;
  intentos: number;
  error_msg: string | null;
  correlation_id: string | null;
  created_at: string;
  enviado_en: string | null;
}
