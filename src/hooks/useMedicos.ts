import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { medicosApi } from '@/api/medicos.api';
import { queryKeys } from '@/lib/queryKeys';

export function useMedicos() {
  return useQuery({
    queryKey: queryKeys.medicos.all,
    queryFn: medicosApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

// Búsqueda + paginación (MedicosAdminPage) — distinto de useMedicos(), que
// trae el catálogo completo para los 4 selectores/agenda que lo necesitan así.
export function useMedicosList(params: { page: number; limit: number; q?: string }) {
  return useQuery({
    queryKey: queryKeys.medicos.admin(params.page, params.q ?? ''),
    queryFn: () => medicosApi.search(params),
    placeholderData: keepPreviousData,
  });
}
