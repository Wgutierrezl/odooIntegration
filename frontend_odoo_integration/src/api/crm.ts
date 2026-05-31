import api from './client';

export const crmApi = {
  getStages: () =>
    api.get('/crm/stages').then((r) => r.data),

  getLeads: (params?: { limit?: number; offset?: number }) =>
    api.get('/crm/leads', { params }).then((r) => r.data),

  getLeadById: (id: number) =>
    api.get(`/crm/leads/${id}`).then((r) => r.data),

  updateStage: (leadId: number, stageId: number) =>
    api.patch(`/crm/leads/${leadId}/stage`, { stage_id: stageId }).then((r) => r.data),
};
