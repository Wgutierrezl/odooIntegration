import { Injectable, NotFoundException } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

const PURCHASE_FIELDS = [
  'id',
  'name',
  'partner_id',
  'state',
  'date_order',
  'amount_total',
  'currency_id',
  'invoice_status',
  'order_line',
];

@Injectable()
export class PurchasesService {
  constructor(private odoo: OdooClient) {}

  async findAll(limit = 40, offset = 0) {
    const domain: any[] = [];
    const [items, total] = await Promise.all([
      this.odoo.searchRead('purchase.order', domain, PURCHASE_FIELDS, limit, offset),
      this.odoo.searchCount('purchase.order', domain),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: number) {
    const records = await this.odoo.read('purchase.order', [id], PURCHASE_FIELDS);
    const po = records[0];
    if (!po) throw new NotFoundException('Orden de compra no encontrada');

    if (po.order_line?.length) {
      po.lines = await this.odoo.read('purchase.order.line', po.order_line, [
        'id',
        'product_id',
        'product_qty',
        'price_unit',
        'price_subtotal',
        'date_planned',
      ]);
    }

    return po;
  }

  async create(dto: CreatePurchaseDto) {
    const lines = dto.lines.map((line) => [
      0,
      0,
      {
        product_id: line.product_id,
        product_qty: line.quantity,
        price_unit: line.price_unit,
      },
    ]);

    const id = await this.odoo.create('purchase.order', {
      partner_id: dto.partner_id,
      order_line: lines,
    });

    if (dto.auto_confirm ?? true) {
      await this.odoo.executeKw('purchase.order', 'button_confirm', [[id]]);
    }

    return this.findOne(id);
  }

  async confirm(id: number) {
    await this.odoo.executeKw('purchase.order', 'button_confirm', [[id]]);
    return this.findOne(id);
  }
}
