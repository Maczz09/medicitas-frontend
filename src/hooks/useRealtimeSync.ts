import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const SSE_URL = (import.meta.env.VITE_API_URL || '') + '/api/v1/realtime/stream';

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[SSE] Conectando a stream en tiempo real...');
    const eventSource = new EventSource(SSE_URL);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Evento recibido:', data);

        if (data.type === 'CONNECTED') {
          console.log('[SSE] Conexión establecida correctamente.');
          return;
        }

        // Invalidar de golpe todas las consultas activas de react-query.
        // Esto garantiza que CUALQUIER página (Pacientes, Pagos, Coberturas, etc.)
        // se recargue automáticamente sin importar de qué entidad sea el evento.
        queryClient.invalidateQueries();
      } catch (err) {
        console.error('[SSE] Error procesando evento:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Error de conexión:', error);
      // NO llamamos a close() para que el navegador intente reconectar automáticamente
    };

    return () => {
      console.log('[SSE] Cerrando conexión');
      eventSource.close();
    };
  }, [queryClient]);
}
