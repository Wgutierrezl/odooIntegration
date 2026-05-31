import api from './client';

export const employeesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/employees', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/employees/${id}`).then((r) => r.data),

  create: (data: { name: string; work_email?: string; job_title?: string; department_id?: number }) =>
    api.post('/employees', data).then((r) => r.data),

  update: (id: number, data: Partial<{ name: string; work_email: string; job_title: string }>) =>
    api.patch(`/employees/${id}`, data).then((r) => r.data),

  getDepartments: () =>
    api.get('/employees/departments').then((r) => r.data),
};
