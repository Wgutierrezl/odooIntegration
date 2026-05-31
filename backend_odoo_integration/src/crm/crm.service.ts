import { Injectable, NotFoundException } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';

const LEAD_FIELDS = [
  'id',
  'name',
  'partner_id',
  'stage_id',
  'expected_revenue',
  'probability',
  'user_id',
  'create_date',
];

const STAGE_FIELDS = ['id', 'name', 'sequence', 'is_won'];

@Injectable()
export class CrmService {
  constructor(private odoo: OdooClient) {}

  async getStages() {
    return this.odoo.searchRead('crm.stage', [], STAGE_FIELDS, 100, 0, 'sequence asc');
  }

  async getLeads(limit = 80, offset = 0) {
    const [items, total] = await Promise.all([
      this.odoo.searchRead('crm.lead', [], LEAD_FIELDS, limit, offset),
      this.odoo.searchCount('crm.lead', []),
    ]);
    return { items, total, limit, offset };
  }

  async getLeadById(id: number) {
    const results = await this.odoo.read('crm.lead', [id], LEAD_FIELDS);
    if (!results[0]) throw new NotFoundException('Lead not found');
    return results[0];
  }

  async updateStage(leadId: number, stageId: number) {
    await this.odoo.write('crm.lead', [leadId], { stage_id: stageId });
    return this.getLeadById(leadId);
  }
}
