import { Injectable } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';

@Injectable()
export class DashboardService {
  constructor(private odoo: OdooClient) {}

  async getSummary() {
    const [
      totalSales,
      totalCustomers,
      totalQuotations,
      totalOpportunities,
      totalInvoices,
      unpaidInvoices,
    ] = await Promise.all([
      this.odoo.searchCount('sale.order', [['state', '=', 'sale']]),
      this.odoo.searchCount('res.partner', [['customer_rank', '>', 0]]),
      this.odoo.searchCount('sale.order', [['state', '=', 'draft']]),
      this.odoo.searchCount('crm.lead', []),
      this.odoo.searchCount('account.move', [['move_type', '=', 'out_invoice']]),
      this.odoo.searchCount('account.move', [
        ['move_type', '=', 'out_invoice'],
        ['payment_state', 'in', ['not_paid', 'partial']],
      ]),
    ]);

    return {
      total_sales: totalSales,
      total_customers: totalCustomers,
      total_quotations: totalQuotations,
      total_opportunities: totalOpportunities,
      total_invoices: totalInvoices,
      unpaid_invoices: unpaidInvoices,
    };
  }

  async getSalesByPeriod(days = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    const sales = await this.odoo.searchRead(
      'sale.order',
      [
        ['state', '=', 'sale'],
        ['date_order', '>=', dateStr],
      ],
      ['id', 'name', 'amount_total', 'date_order', 'partner_id'],
      200,
      0,
      'date_order desc',
    );

    return { period_days: days, sales };
  }

  async getTopProducts(limit = 10) {
    const lines = await this.odoo.searchRead(
      'sale.order.line',
      [['order_id.state', '=', 'sale']],
      ['product_id', 'product_uom_qty', 'price_subtotal'],
      500,
      0,
    );

    const productMap = new Map<number, { name: string; qty: number; revenue: number }>();

    for (const line of lines) {
      const [pid, pname] = line.product_id;
      const existing = productMap.get(pid) || { name: pname, qty: 0, revenue: 0 };
      existing.qty += line.product_uom_qty;
      existing.revenue += line.price_subtotal;
      productMap.set(pid, existing);
    }

    return Array.from(productMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getOpportunitiesByStage() {
    const [stages, leads] = await Promise.all([
      this.odoo.searchRead('crm.stage', [], ['id', 'name', 'sequence'], 100, 0, 'sequence asc'),
      this.odoo.searchRead('crm.lead', [], ['stage_id', 'expected_revenue'], 500),
    ]);

    return stages.map((stage) => {
      const stageLeads = leads.filter(
        (l) => l.stage_id && l.stage_id[0] === stage.id,
      );
      return {
        stage_id: stage.id,
        stage_name: stage.name,
        count: stageLeads.length,
        total_revenue: stageLeads.reduce(
          (sum, l) => sum + (l.expected_revenue || 0),
          0,
        ),
      };
    });
  }
}
