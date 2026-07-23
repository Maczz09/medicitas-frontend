import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http, API_URL } from '@/api/http';
import { useRealtimeStore } from '@/store/realtime.store';
import { useResilienceStore } from '@/store/resilience.store';
import { useActivityStore } from '@/store/activity.store';
import { REALTIME_QUERY_MAP } from '@/lib/realtimeQueryMap';
import { coberturasApi } from '@/api/coberturas.api';
import { adminApi } from '@/api/admin.api';
import { nombreModuloLegible } from '@/lib/nombresModulos';
import type { EstadoCobertura } from '@/types';

const STREAM_BASE = `${API_URL}/realtime`;
const BACKOFF_INICIAL_MS = 1000;
const BACKOFF_MAX_MS = 15000;

// Un warning por tipo de evento no mapeado (no en cada mensaje) para no
// inundar la consola si un evento nuevo llega repetidas veces sin mapear.
const tiposYaAdvertidos = new Set<string>();

interface SseEnvelope {
  type: string;
  payload?: {
    payload?: Record<string, unknown>;
  };
}

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const marcarCircuitoAbierto = useResilienceStore((s) => s.marcarCircuitoAbierto);
  const marcarCircuitoCerrado = useResilienceStore((s) => s.marcarCircuitoCerrado);
  const marcarServicioDeshabilitado = useResilienceStore((s) => s.marcarServicioDeshabilitado);
  const marcarServicioHabilitado = useResilienceStore((s) => s.marcarServicioHabilitado);
  const updateCobertura = useActivityStore((s) => s.updateCobertura);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reintentoTimer: ReturnType<typeof setTimeout> | null = null;
    let cerrado = false;
    let backoffMs = BACKOFF_INICIAL_MS;
    let lastEventId: string | null = null;

    function invalidar(queryKey: QueryKey) {
      queryClient.invalidateQueries({ queryKey });
    }

    function programarReintento() {
      if (cerrado) return;
      setStatus('reconectando');
      reintentoTimer = setTimeout(conectar, backoffMs);
      backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
    }

    async function conectar() {
      if (cerrado) return;
      setStatus('reconectando');

      // El ticket es de un solo uso (ver realtime.routes.js): EventSource no
      // permite headers custom, así que no puede viajar el JWT normal. Se
      // pide uno nuevo en CADA conexión/reconexión vía el cliente http ya
      // autenticado (mismo interceptor de Bearer + refresh que el resto de la app).
      let ticket: string;
      try {
        const { data } = await http.post<{ ticket: string }>('/realtime/ticket');
        ticket = data.ticket;
      } catch {
        if (cerrado) return;
        programarReintento();
        return;
      }
      if (cerrado) return;

      const params = new URLSearchParams({ ticket });
      if (lastEventId) params.set('lastEventId', lastEventId);
      eventSource = new EventSource(`${STREAM_BASE}/stream?${params.toString()}`);

      eventSource.onopen = () => {
        backoffMs = BACKOFF_INICIAL_MS;
        setStatus('conectado');
      };

      eventSource.onmessage = (event) => {
        if (event.lastEventId) lastEventId = event.lastEventId;

        let data: SseEnvelope;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'CONNECTED') return;

        // Eventos operativos (circuit breaker, kill-switch) — actualizan el
        // store de resiliencia que lee ResilienceBanner.tsx, nunca invalidan
        // cache (no son eventos de datos). El `return` explícito es
        // obligatorio: sin él, al no estar en REALTIME_QUERY_MAP caerían en
        // la rama "no mapeado" de abajo e invalidarían TODO el cache en cada
        // apertura/cierre de circuito o toggle de kill-switch.
        if (data.type === 'CircuitBreakerAbierto') {
          const servicio = data.payload?.payload?.servicio as string;
          const nombreTecnico = data.payload?.payload?.nombreTecnico as string;
          marcarCircuitoAbierto(nombreTecnico, servicio);
          toast(
            `🔌 El servicio de ${servicio} no está disponible temporalmente (circuito de protección abierto). El sistema dejó de intentarlo y se recuperará solo.`,
            { icon: '🔌', duration: 6000 },
          );
          return;
        }
        if (data.type === 'CircuitBreakerCerrado') {
          const servicio = data.payload?.payload?.servicio as string;
          const nombreTecnico = data.payload?.payload?.nombreTecnico as string;
          marcarCircuitoCerrado(nombreTecnico);
          toast(`✅ El servicio de ${servicio} se recuperó.`, { icon: '✅', duration: 4000 });
          return;
        }
        if (data.type === 'ServicioDeshabilitado') {
          const servicio = data.payload?.payload?.servicio as string;
          marcarServicioDeshabilitado(servicio);
          toast(`🛑 El servicio de ${servicio} fue deshabilitado por un administrador.`, { icon: '🛑', duration: 6000 });
          return;
        }
        if (data.type === 'ServicioHabilitado') {
          const servicio = data.payload?.payload?.servicio as string;
          marcarServicioHabilitado(servicio);
          toast(`✅ El servicio de ${servicio} fue rehabilitado.`, { icon: '✅', duration: 4000 });
          return;
        }

        // No se pudo reenviar lo perdido durante la desconexión (ventana de
        // resync expirada, o se reconectó a otro worker del cluster) — red
        // de seguridad en vez de quedarse con datos desactualizados.
        if (data.type === 'RESYNC_GAP') {
          queryClient.invalidateQueries();

          // invalidateQueries() no toca el activity store (Zustand persistido,
          // no React Query) — sin esto, una cobertura que quedó esFallback:true
          // justo durante el hueco de reconexión se queda así para siempre, sin
          // ningún evento futuro que la corrija (una vez reconciliada en el
          // backend, no vuelve a tocarse). Solo re-consulta las que siguen
          // marcadas fallback — las ya confirmadas no necesitan nada.
          const pendientes = useActivityStore.getState().coberturas.filter((c) => c.esFallback);
          pendientes.forEach((c) => {
            coberturasApi
              .getById(c.idValidacion)
              .then((fresco) => {
                updateCobertura(c.idValidacion, {
                  estadoCobertura: fresco.estadoCobertura,
                  porcentajeCobertura: fresco.porcentajeCobertura,
                  codigoAutorizacion: fresco.codigoAutorizacion,
                  vigencia: fresco.vigencia,
                  esFallback: fresco.esFallback,
                });
              })
              .catch(() => { /* best-effort — se reintentará en el próximo hueco o evento */ });
          });
          return;
        }

        // Cobertura validada/rechazada/pendiente: además de la invalidación
        // genérica de abajo (para AdminCoberturasPage, vista de Auditor),
        // empuja el dato fresco al activity store — es lo que lee
        // ValidarCoberturaPage.tsx en vez de un useState local, para que una
        // reconciliación de fondo (aseguradora recuperada tras una caída) se
        // vea al instante sin que el recepcionista tenga que reclickear.
        if (
          data.type === 'CoberturaValidada' ||
          data.type === 'CoberturaRechazada' ||
          data.type === 'CoberturaPendiente'
        ) {
          const payload = data.payload?.payload as
            | {
                idValidacion?: string;
                estadoCobertura?: EstadoCobertura;
                porcentajeCobertura?: number;
                codigoAutorizacion?: string | null;
                vigencia?: string | null;
                esFallback?: boolean;
              }
            | undefined;
          const idValidacion = payload?.idValidacion;
          if (idValidacion) {
            const previa = useActivityStore.getState().coberturas.find((c) => c.idValidacion === idValidacion);
            const esFallbackNuevo = payload?.esFallback ?? false;
            updateCobertura(idValidacion, {
              estadoCobertura: payload?.estadoCobertura,
              porcentajeCobertura: payload?.porcentajeCobertura,
              codigoAutorizacion: payload?.codigoAutorizacion ?? null,
              vigencia: payload?.vigencia ?? null,
              esFallback: esFallbackNuevo,
            });
            // Solo avisar cuando pasa de degradado (fallback) a confirmado —
            // una validación manual normal ya muestra su propio toast síncrono
            // de "Validación completada" en ValidarCoberturaPage.tsx.
            if (previa?.esFallback && !esFallbackNuevo) {
              toast(
                `✅ Cobertura de ${previa.pacienteNombre ?? previa.idPaciente} confirmada con la aseguradora: ahora ${payload?.estadoCobertura}.`,
                { icon: '✅', duration: 6000 },
              );
            }
          }
          // Sin `return`: debe seguir a REALTIME_QUERY_MAP para refrescar
          // también la vista de Auditor (AdminCoberturasPage).
        }

        // Aviso puntual: el despacho a farmacia ocurre async (vía RabbitMQ),
        // así que quien registró la atención puede estar ya en otra pantalla
        // cuando el fallo/contingencia realmente ocurre.
        if (data.type === 'RecetaContingenciaGenerada') {
          const medicamento = data.payload?.payload?.medicamento;
          toast(
            `⚠️ Farmacia no disponible — la receta${medicamento ? ` de ${medicamento}` : ''} se envió al paciente por WhatsApp en PDF. Quedó encolada y se reintentará automáticamente.`,
            { icon: '⚠️', duration: 8000 },
          );
        }

        // Alerta accionable para el auditor: un pago que se cobró sin poder
        // verificar la cobertura en el momento (Seguros caído) resultó, al
        // reconciliar, con una cobertura que NO coincide con lo declarado.
        // A diferencia de CoberturaValidada arriba, este SIEMPRE amerita un
        // toast (nunca es el camino feliz) — el pago no se revierte solo, hay
        // que revisarlo a mano.
        if (data.type === 'PagoCoberturaInconsistente') {
          toast.error(
            '⚠️ Un pago quedó con cobertura inconsistente tras reconciliar con Seguros — requiere revisión manual en Pagos.',
            { duration: 10000 },
          );
        }

        const keys = REALTIME_QUERY_MAP[data.type];
        if (keys) {
          keys.forEach(invalidar);
        } else {
          if (!tiposYaAdvertidos.has(data.type)) {
            tiposYaAdvertidos.add(data.type);
            console.warn('[SSE] Tipo de evento sin mapear en realtimeQueryMap.ts — invalidando todo:', data.type);
          }
          queryClient.invalidateQueries();
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        programarReintento();
      };
    }

    // Snapshot de "qué está caído/abierto AHORA MISMO" — independiente de la
    // conexión SSE de arriba (si esta falla, igual queremos el estado real).
    // Sin esto, el ResilienceBanner solo se enteraba de transiciones vistas en
    // vivo DESDE que esta pestaña se conectó: un kill-switch o un circuito ya
    // abierto ANTES de cargar la página (o de un F5) quedaba invisible hasta
    // la siguiente transición real — exactamente el bug reportado en vivo.
    async function sincronizarEstadoActual() {
      try {
        const [servicios, circuitos] = await Promise.all([adminApi.servicios(), adminApi.circuitos()]);
        Object.entries(servicios).forEach(([nombre, habilitado]) => {
          if (!habilitado) marcarServicioDeshabilitado(nombreModuloLegible(nombre));
        });
        circuitos.forEach((c) => marcarCircuitoAbierto(c.nombreTecnico, c.servicio));
      } catch {
        // best-effort — si falla, el próximo evento SSE real igual sincroniza
      }
    }

    conectar();
    sincronizarEstadoActual();

    return () => {
      cerrado = true;
      if (reintentoTimer) clearTimeout(reintentoTimer);
      eventSource?.close();
      setStatus('desconectado');
    };
  }, [
    queryClient,
    setStatus,
    marcarCircuitoAbierto,
    marcarCircuitoCerrado,
    marcarServicioDeshabilitado,
    marcarServicioHabilitado,
    updateCobertura,
  ]);
}
