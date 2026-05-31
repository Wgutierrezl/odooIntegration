import api from './client';

export const dashboardApi = {
  getSummary: () =>
    api.get('/dashboard/summary').then((r) => r.data),

  getSales: (days?: number) =>
    api.get('/dashboard/sales', { params: { days } }).then((r) => r.data),

  getTopProducts: (limit?: number) =>
    api.get('/dashboard/top-products', { params: { limit } }).then((r) => r.data),

  getOpportunities: () =>
    api.get('/dashboard/opportunities').then((r) => r.data),
};
