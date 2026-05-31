import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async listByDomain(domain: any[], limit = 40, offset = 0) {
    const [items, total] = await Promise.all([
      this.odoo.searchRead('sale.order', domain, ORDER_FIELDS, limit, offset),
      this.odoo.searchCount('sale.order', domain),
    ]);
    return { items, total, limit, offset };
  }

  async findAll(limit = 40, offset = 0) {
    return this.listByDomain([], limit, offset);
  }

  async findQuotations(limit = 40, offset = 0) {
    return this.listByDomain([['state', 'in', ['draft', 'sent']]], limit, offset);
  }

  async findOrders(limit = 40, offset = 0) {
    return this.listByDomain([['state', 'in', ['sale', 'done']]], limit, offset);
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

    return this.findOne(id);
  }

  async getQuotationPdf(saleOrderId: number) {
    const order = await this.findOne(saleOrderId);
    if (!['draft', 'sent'].includes(order.state)) {
      throw new BadRequestException(
        `La orden ${order.name} no está en estado de cotización (draft/sent). Estado actual: ${order.state}`,
      );
    }
    return this.odoo.downloadQuotationPdf(saleOrderId);
  }

  async getSaleOrderPdf(saleOrderId: number) {
    const order = await this.findOne(saleOrderId);
    if (!['sale', 'done'].includes(order.state)) {
      throw new BadRequestException(
        `La orden ${order.name} no está confirmada (sale/done). Estado actual: ${order.state}`,
      );
    }
    return this.odoo.downloadSaleOrderPdf(saleOrderId);
  }

  async getInvoicePdfByInvoiceId(invoiceId: number, allowDraft = false) {
    const invoice = await this.odoo.read('account.move', [invoiceId], ['id', 'name', 'state']);
    const doc = invoice[0];
    if (!doc) throw new NotFoundException('Factura no encontrada');

    if (doc.state === 'draft' && !allowDraft) {
      throw new BadRequestException(
        'La factura todavía está en borrador. Debe publicarse en Odoo antes de descargarla como factura final.',
      );
    }

    if (doc.state === 'draft' && allowDraft) {
      return this.odoo.downloadInvoicePdf(invoiceId);
    }

    if (doc.state !== 'posted') {
      throw new BadRequestException(`Factura en estado no descargable: ${doc.state}`);
    }

    return this.odoo.downloadInvoicePdf(invoiceId);
  }

  async getDocuments(saleOrderId: number) {
    const order = await this.findOne(saleOrderId);
    const invoices = order.invoice_ids?.length
      ? await this.odoo.read('account.move', order.invoice_ids, ['id', 'name', 'state'])
      : [];

    const isQuotation = ['draft', 'sent'].includes(order.state);
    const isSaleOrder = ['sale', 'done'].includes(order.state);

    return {
      saleOrderId,
      state: order.state,
      documentType: isQuotation ? 'quotation' : isSaleOrder ? 'sale_order' : 'unknown',
      availableDocuments: {
        quotationPdf: isQuotation,
        saleOrderPdf: isSaleOrder,
        draftInvoicePdf: invoices.some((i) => i.state === 'draft'),
        postedInvoicePdf: invoices.some((i) => i.state === 'posted'),
      },
      invoices: invoices.map((i) => ({
        id: i.id,
        name: i.name,
        state: i.state,
        canDownload: i.state === 'draft' || i.state === 'posted',
        isFinal: i.state === 'posted',
      })),
    };
  }

  async getInvoicePdf(orderId: number) {
    const order = await this.findOne(orderId);
    const invoiceIds = order.invoice_ids;

    if (!invoiceIds?.length) {
      throw new NotFoundException('No se encontró factura para esta orden');
    }

    const posted = await this.odoo.searchRead(
      'account.move',
      [
        ['id', 'in', invoiceIds],
        ['state', '=', 'posted'],
      ],
      ['id'],
      1,
      0,
    );

    if (!posted.length) {
      throw new BadRequestException(
        'La factura todavía está en borrador. Debe publicarse en Odoo antes de descargarla como factura final.',
      );
    }

    return this.odoo.downloadInvoicePdf(posted[0].id);
  }
}
