import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pacientesApi } from '@/api/pacientes.api';
import type {
  ActualizarContactoInput,
  ActualizarPacienteInput,
  CrearPacienteInput,
  ListarPacientesParams,
} from '@/types';

export function usePacientesList(params: ListarPacientesParams) {
  return useQuery({
    queryKey: ['pacientes', params],
    queryFn: () => pacientesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePaciente(id: string | undefined) {
  return useQuery({
    // Prefijo 'pacientes' (plural) a propósito, no 'paciente' — es el que ya
    // invalida REALTIME_QUERY_MAP para PacienteActualizado/DatosContactoActualizados/
    // EstadoPacienteActualizado. Con el singular, un cambio hecho desde OTRA
    // sesión/pestaña nunca llegaba a esta ficha (solo se refrescaba si la
    // edición ocurría desde esta misma página, vía las invalidaciones manuales
    // de abajo).
    queryKey: ['pacientes', 'detail', id],
    queryFn: () => pacientesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCrearPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearPacienteInput) => pacientesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] }),
  });
}

export function useActualizarPaciente(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ActualizarPacienteInput) => pacientesApi.update(id, body),
    // 'pacientes' cubre la lista Y la ficha ('pacientes','detail',id) por
    // coincidencia de prefijo — no hace falta invalidar aparte.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] }),
  });
}

export function useActualizarContacto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ActualizarContactoInput) => pacientesApi.updateContacto(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] }),
  });
}

export function useToggleEstadoPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      pacientesApi.toggleEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] }),
  });
}
