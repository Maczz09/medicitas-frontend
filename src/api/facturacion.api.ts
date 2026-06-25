import { http, API_URL } from './http';

export const facturacionApi = {
  comprobantePorPago: (idPago: string) =>
    http.get(`/facturacion/pago/${idPago}/comprobante`).then((r) => r.data),

  comprobantePorId: (id: string) =>
    http.get(`/facturacion/comprobantes/${id}`).then((r) => r.data),

  /** URL pública directa del PDF (el endpoint no requiere auth). */
  pdfUrl: (id: string) => `${API_URL}/facturacion/comprobantes/${id}/pdf`,

  /** Descarga el PDF como Blob para forzar "guardar como". */
  descargarPdf: async (id: string): Promise<Blob> => {
    const res = await http.get(`/facturacion/comprobantes/${id}/pdf`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};
