import { Injectable, NotFoundException } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';
import { CreateSaleDto } from './dto/create-sale.dto';

const ORDER_FIELDS = [
  'id',
  'name',
  'partner_id',
  'state',
  'amount_total',
  'amount_untaxed',
  'currency_id',
  'invoice_status',
  'date_order',
  'user_id',
  'payment_term_id',
  'invoice_ids',
];

@Injectable()
export class SalesService {
  constructor(private odoo: OdooClient) {}

  async findAll(limit = 40, offset = 0) {
    const [items, total] = await Promise.all([
      this.odoo.searchRead('sale.order', [], ORDER_FIELDS, limit, offset),
      this.odoo.searchCount('sale.order', []),
    ]);
    return { items, total, limit, offset };
  }

  async findOne(id: number) {
    const orders = await this.odoo.read('sale.order', [id], [
      ...ORDER_FIELDS,
      'order_line',
      'client_order_ref',
    ]);
    const order = orders[0];
    if (!order) throw new NotFoundException('Orden de venta no encontrada');

    if (order.order_line?.length) {
      order.lines = await this.odoo.read('sale.order.line', order.order_line, [
        'id',
        'product_id',
        'product_uom_qty',
        'price_unit',
        'price_subtotal',
      ]);
    }

    if (order.invoice_ids?.length) {
      const invoices = await this.odoo.read('account.move', order.invoice_ids, [
        'id',
        'name',
        'state',
        'payment_state',
        'invoice_date',
        'invoice_date_due',
        'amount_total',
        'currency_id',
      ]);
      order.invoices = invoices;
    }

    return order;
  }

  async create(dto: CreateSaleDto) {
    const orderLines = dto.lines.map((line) => [
      0,
      0,
      {
        product_id: line.product_id,
        product_uom_qty: line.quantity,
        price_unit: line.price_unit,
      },
    ]);

    const orderId = await this.odoo.create('sale.order', {
      partner_id: dto.partner_id,
      order_line: orderLines,
    });

    return this.findOne(orderId);
  }

  private async ensureConfirmed(orderId: number) {
    const order = await this.findOne(orderId);

    if (order.state === 'sale' || order.state === 'done') {
      return order;
    }

    if (!['draft', 'sent'].includes(order.state)) {
      throw new Error(
        `La orden ${order.name} está en estado '${order.state}' y no puede confirmarse automáticamente`,
      );
    }

    await this.odoo.executeKw('sale.order', 'action_confirm', [[orderId]]);
    return this.findOne(orderId);
  }

  async confirm(id: number) {
    await this.ensureConfirmed(id);
    return this.findOne(id);
  }

  async createInvoice(id: number) {
    await this.ensureConfirmed(id);

    const wizardId = await this.odoo.create('sale.advance.payment.inv', {
      advance_payment_method: 'delivered',
      sale_order_ids: [[6, 0, [id]]],
    });

    await this.odoo.executeKw(
      'sale.advance.payment.inv',
      'create_invoices',
      [[wizardId]],
    );

    const order = await this.findOne(id);
    return order;
  }

  async getInvoicePdf(orderId: number) {
    const order = await this.findOne(orderId);
    const invoiceIds = order.invoice_ids;

    if (!invoiceIds?.length) {
      throw new NotFoundException('No se encontró factura para esta orden');
    }

    const invoiceId = invoiceIds[0];
    return this.odoo.renderInvoicePdf(invoiceId);
  }
}
