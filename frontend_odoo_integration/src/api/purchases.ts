import api from './client';

interface PurchaseLine {
  product_id: number;
  quantity: number;
  price_unit: number;
}

export const purchasesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/purchases', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/purchases/${id}`).then((r) => r.data),

  create: (data: { partner_id: number; lines: PurchaseLine[]; auto_confirm?: boolean }) =>
    api.post('/purchases', data).then((r) => r.data),

  confirm: (id: number) =>
    api.post(`/purchases/${id}/confirm`).then((r) => r.data),
};
