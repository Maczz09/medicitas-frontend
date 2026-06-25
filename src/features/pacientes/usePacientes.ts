import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pacientesApi } from '@/api/pacientes.api';
import type { ActualizarContactoInput, CrearPacienteInput, ListarPacientesParams } from '@/types';

export function usePacientesList(params: ListarPacientesParams) {
  return useQuery({
    queryKey: ['pacientes', params],
    queryFn: () => pacientesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePaciente(id: string | undefined) {
  return useQuery({
    queryKey: ['paciente', id],
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

export function useActualizarContacto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ActualizarContactoInput) => pacientesApi.updateContacto(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      qc.invalidateQueries({ queryKey: ['paciente', id] });
    },
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
