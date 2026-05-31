import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  getProfile: () => api.get('/auth/me').then((r) => r.data),
};
