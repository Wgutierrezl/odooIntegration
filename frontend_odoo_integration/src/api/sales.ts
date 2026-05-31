import api from './client';

interface SaleLine {
  product_id: number;
  quantity: number;
  price_unit: number;
}

export const salesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/sales', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/sales/${id}`).then((r) => r.data),

  create: (data: { partner_id: number; lines: SaleLine[] }) =>
    api.post('/sales', data).then((r) => r.data),

  confirm: (id: number) =>
    api.post(`/sales/${id}/confirm`).then((r) => r.data),

  createInvoice: (id: number) =>
    api.post(`/sales/${id}/invoice`).then((r) => r.data),

  downloadInvoicePdf: (id: number) =>
    api.get(`/sales/${id}/invoice/pdf`, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-order-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    }),
};
