import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '@/api/auditoria.api';
import {
  Server,
  ShieldCheck,
  Stethoscope,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MonitoreoPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health-status'],
    queryFn: auditoriaApi.health,
    refetchInterval: 3000, // Polling cada 3 segundos
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Monitoreo de Sistema"
        subtitle="Estado en tiempo real de los servicios y APIs."
      />

      {isLoading && !health ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MediCitas Core */}
          <div className="bg-surface border border-brand-primary/10 rounded-xl p-5 shadow-sm hover:border-brand-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-text-primary">MediCitas Core</h3>
            </div>
            <div className="flex items-center gap-2">
              {health?.medicitas?.status === 'UP' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">En línea</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger" />
                  <span className="text-danger font-medium">Caído</span>
                </>
              )}
            </div>
          </div>

          {/* Aseguradora API */}
          <div className="bg-surface border border-brand-primary/10 rounded-xl p-5 shadow-sm hover:border-brand-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-text-primary">Aseguradora API</h3>
            </div>
            <div className="flex items-center gap-2">
              {health?.aseguradora?.status === 'UP' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">En línea</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger" />
                  <span className="text-danger font-medium">Caído</span>
                </>
              )}
            </div>
          </div>

          {/* Farmacia API */}
          <div className="bg-surface border border-brand-primary/10 rounded-xl p-5 shadow-sm hover:border-brand-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-text-primary">Farmacia API</h3>
            </div>
            <div className="flex items-center gap-2">
              {health?.farmacia?.status === 'UP' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">En línea</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger" />
                  <span className="text-danger font-medium">Caído</span>
                </>
              )}
            </div>
          </div>

          {/* WhatsApp Web */}
          <div className="bg-surface border border-brand-primary/10 rounded-xl p-5 shadow-sm hover:border-brand-primary/30 transition-colors md:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-text-primary">WhatsApp API</h3>
                </div>
                {health?.whatsapp?.isConnected && (
                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro que deseas desvincular WhatsApp? Deberás escanear el QR nuevamente.')) {
                        auditoriaApi.unlinkWhatsapp().then(() => {
                          window.alert('WhatsApp desvinculado con éxito. Generando nuevo QR...');
                        }).catch(e => {
                          window.alert('Error al desvincular: ' + (e.response?.data?.error || e.message));
                        });
                      }
                    }}
                    className="text-xs px-3 py-1 bg-danger/10 text-danger hover:bg-danger/20 rounded-md font-medium transition-colors border border-danger/20"
                  >
                    Desvincular
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {health?.whatsapp?.isConnected ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="text-success font-medium">Vinculado y Listo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-warning" />
                      <span className="text-warning font-medium">Esperando vinculación</span>
                    </>
                  )}
                </div>
                
                {!health?.whatsapp?.isConnected && !health?.whatsapp?.currentQrDataUri && (
                  <div className="flex flex-col items-center mt-2 p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
                    <p className="text-sm text-gray-500 font-medium text-center">Generando código QR...</p>
                    <p className="text-xs text-gray-400 text-center mt-1">Este proceso puede tardar unos 15 segundos.</p>
                  </div>
                )}
                
                {!health?.whatsapp?.isConnected && health?.whatsapp?.currentQrDataUri && (
                  <div className="flex flex-col items-center mt-2 p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 font-medium text-center">ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP</p>
                    <img 
                      src={health.whatsapp.currentQrDataUri} 
                      alt="WhatsApp QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-primary">
                      {health.whatsapp.qrGeneratedAt && (
                        <QrCountdown qrGeneratedAt={health.whatsapp.qrGeneratedAt} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QrCountdown({ qrGeneratedAt }: { qrGeneratedAt: number }) {
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    const calcTime = () => {
      const elapsed = Math.floor((Date.now() - qrGeneratedAt) / 1000);
      const remaining = 20 - elapsed;
      return remaining > 0 ? remaining : 0;
    };

    setTimeLeft(calcTime());
    const interval = setInterval(() => {
      setTimeLeft(calcTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [qrGeneratedAt]);

  if (timeLeft === 0) {
    return <span className="text-gray-400">Actualizando código...</span>;
  }

  return <span>El código expira en {timeLeft}s</span>;
}
