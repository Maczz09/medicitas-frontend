import { useQuery } from '@tanstack/react-query';
import { medicosApi } from '@/api/medicos.api';

export function useMedicos() {
  return useQuery({
    queryKey: ['medicos'],
    queryFn: medicosApi.list,
    staleTime: 5 * 60 * 1000,
  });
}
