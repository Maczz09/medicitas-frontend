export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE';
export type Sexo = 'M' | 'F' | 'Otro';

export interface Paciente {
  id_paciente: string;
  nombre: string;
  apellido: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  telefono: string;
  email?: string | null;
  direccion?: string | null;
  activo: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearPacienteInput {
  nombre: string;
  apellido: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  telefono: string;
  email?: string;
  direccion?: string;
}

export interface ActualizarContactoInput {
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface ListarPacientesParams {
  q?: string;
  page?: number;
  limit?: number;
}
