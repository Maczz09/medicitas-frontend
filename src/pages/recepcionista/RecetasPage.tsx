import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCheck, Pill, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { EstadoRecetaBadge } from '@/components/domain/StatusBadge';
import { prescripcionesApi } from '@/api/prescripciones.api';
import { apiError } from '@/api/http';
import { useActivityStore } from '@/store/activity.store';
import type { Receta } from '@/types';

export default function RecetasPage() {
  const { recetas, addReceta, updateReceta } = useActivityStore();
  const [idReceta, setIdReceta] = useState('');
  const [current, setCurrent] = useState<Receta | null>(null);

  const registrar = (r: Receta) => {
    addReceta({
      id: r.id,
      estado: r.estado,
      medicamento: r.contenido?.medicamento,
      ts: Date.now(),
    });
    setCurrent(r);
  };

  const buscar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.getById(id),
    onSuccess: registrar,
    onError: (err) => toast.error(apiError(err, 'Receta no encontrada')),
  });

  const reintentar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.reintentar(id, crypto.randomUUID()),
    onSuccess: (r) => {
      if (r.estado) updateReceta(r.id, { estado: r.estado });
      setCurrent((c) => (c ? { ...c, estado: r.estado ?? c.estado } : c));
      toast.success('Reintento de envío iniciado');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const retirar = useMutation({
    mutationFn: (id: string) => prescripcionesApi.marcarRetirada(id, crypto.randomUUID()),
    onSuccess: (r) => {
      updateReceta(r.id, { estado: 'RETIRADA' });
      setCurrent((c) => (c ? { ...c, estado: 'RETIRADA' } : c));
      toast.success('Retiro registrado');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const refrescar = (id: string) => buscar.mutate(id);

  return (
    <div>
      <PageHeader title="Recetas" subtitle="Consulta el estado de los despachos en farmacia" />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <Search className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-ink-100">Buscar receta</h3>
          </div>
          <CardBody className="space-y-4">
            <Input
              label="ID de la receta"
              value={idReceta}
              onChange={(e) => setIdReceta(e.target.value)}
              placeholder="REC-XXXXXX"
              onKeyDown={(e) => e.key === 'Enter' && idReceta && buscar.mutate(idReceta)}
            />
            <Button className="w-full" disabled={!idReceta} loading={buscar.isPending} onClick={() => buscar.mutate(idReceta)}>
              Consultar estado
            </Button>

            {current && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-400">{current.id}</span>
                  <EstadoRecetaBadge estado={current.estado} />
                </div>
                {current.contenido?.medicamento && (
                  <p className="mt-2 text-sm font-medium text-ink-100">{current.contenido.medicamento}</p>
                )}
                {current.motivoRechazo && (
                  <p className="mt-1 text-xs text-rose-300/80">{current.motivoRechazo}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(current.estado === 'RECHAZADA_POR_VALIDACION' || current.estado === 'RECHAZADA_POR_STOCK') && (
                    <Button size="sm" variant="secondary" loading={reintentar.isPending} leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => reintentar.mutate(current.id)}>
                      Reintentar envío
                    </Button>
                  )}
                  {current.estado === 'DESPACHADA' && (
                    <Button size="sm" variant="success" loading={retirar.isPending} leftIcon={<CheckCheck className="h-3.5 w-3.5" />} onClick={() => retirar.mutate(current.id)}>
                      Marcar retirada
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => refrescar(current.id)}>
                    Actualizar
                  </Button>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-ink-100">Recetas consultadas</h3>
          </div>
          {recetas.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Sin recetas consultadas"
              description="Busca una receta por su ID para ver su estado en farmacia."
            />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {recetas.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-ink-100">{r.id}</p>
                    {r.medicamento && <p className="truncate text-xs text-ink-500">{r.medicamento}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <EstadoRecetaBadge estado={r.estado} />
                    <button
                      onClick={() => {
                        setIdReceta(r.id);
                        buscar.mutate(r.id);
                      }}
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-brand-300"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
