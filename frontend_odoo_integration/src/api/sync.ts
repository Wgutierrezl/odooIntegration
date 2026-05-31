import api from './client';

export const syncApi = {
  trigger: () => api.post('/sync/trigger').then((r) => r.data),
};
