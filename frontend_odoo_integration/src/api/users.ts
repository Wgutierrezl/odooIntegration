import api from './client';

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),

  create: (data: { email: string; password: string; full_name: string; role_id: number }) =>
    api.post('/users', data).then((r) => r.data),

  update: (id: string, data: { full_name?: string; role_id?: number; is_active?: boolean }) =>
    api.patch(`/users/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
