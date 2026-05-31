import api from './client';

interface CreateContact {
  name: string;
  email?: string;
  phone?: string;
  is_company?: boolean;
}

export const contactsApi = {
  listCustomers: (params?: { q?: string; limit?: number; offset?: number }) =>
    api.get('/contacts/customers', { params }).then((r) => r.data),

  listSuppliers: (params?: { q?: string; limit?: number; offset?: number }) =>
    api.get('/contacts/suppliers', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/contacts/${id}`).then((r) => r.data),

  createCustomer: (data: CreateContact) =>
    api.post('/contacts/customers', data).then((r) => r.data),

  createSupplier: (data: CreateContact) =>
    api.post('/contacts/suppliers', data).then((r) => r.data),
};
