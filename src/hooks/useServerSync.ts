import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { citasApi } from '@/api/citas.api';
import { pagosApi } from '@/api/pagos.api';
import { useActivityStore } from '@/store/activity.store';
import type { EstadoCita } from '@/types';

export function useServerSync() {
  const citasQuery = useQuery({
    queryKey: ['server-sync-citas'],
    queryFn: () => citasApi.list({ page: 1, limit: 100 }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const pagosQuery = useQuery({
    queryKey: ['server-sync-pagos'],
    queryFn: () => pagosApi.list({ page: 1, limit: 100 }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!citasQuery.data && !pagosQuery.data) return;

    const citasFromServer = (citasQuery.data?.data ?? []).map((c) => ({
      idCita:         c.id,
      idPaciente:     c.id_paciente,
      idMedico:       c.id_medico,
      fechaHora:      c.fecha_hora,
      especialidad:   c.especialidad,
      estado:         c.estado as EstadoCita,
      pacienteNombre: c.paciente_nombre ?? undefined,
      medicoNombre:   c.medico_nombre ?? undefined,
      ts:             new Date(c.created_at).getTime(),
    }));

    const pagosFromServer = (pagosQuery.data?.data ?? []).map((p) => ({
      idPago:          p.id_pago,
      idCita:          p.id_cita,
      estado:          p.estado as any,
      montoTotal:      Number(p.monto_total),
      montoCopago:     Number(p.monto_copago),
      tipoComprobante: p.tipo_comprobante,
      pacienteNombre:  p.paciente_nombre ?? undefined,
      ts:              new Date(p.created_at).getTime(),
    }));

    useActivityStore.setState({
      citas: citasFromServer,
      pagos: pagosFromServer,
    });
  }, [citasQuery.data, pagosQuery.data]);

  return { isSyncing: citasQuery.isFetching || pagosQuery.isFetching };
}
