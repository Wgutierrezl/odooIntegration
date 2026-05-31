import api from './client';

export const productsApi = {
  list: (params?: { q?: string; limit?: number; offset?: number }) =>
    api.get('/products', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/products/${id}`).then((r) => r.data),

  create: (data: { name: string; list_price: number; default_code?: string }) =>
    api.post('/products', data).then((r) => r.data),
};
