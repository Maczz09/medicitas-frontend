import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { citasApi } from '@/api/citas.api';
import { pagosApi } from '@/api/pagos.api';
import { useActivityStore } from '@/store/activity.store';
import { useAuthStore } from '@/store/auth.store';
import type { EstadoCita } from '@/types';

export function useServerSync() {
  const rol = useAuthStore((s) => s.user?.rol);
  // GET /pagos está restringido a Recepcionista/Auditor en el backend — un
  // Médico que la consultara recibiría 403 en cada refetch. Con el stream de
  // tiempo real (SSE) entregando eventos correctamente, invalidateQueries()
  // se dispara en cada evento del sistema y refetch-eaba esta consulta
  // prohibida en cascada para cualquier médico con estas páginas abiertas.
  const puedeVerPagos = rol === 'Recepcionista' || rol === 'Auditor';

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
    enabled: puedeVerPagos,
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
