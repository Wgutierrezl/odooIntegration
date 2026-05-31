import { Injectable } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

const PRODUCT_FIELDS = [
  'id',
  'name',
  'list_price',
  'default_code',
  'categ_id',
  'type',
  'qty_available',
  'image_128',
];

@Injectable()
export class ProductsService {
  constructor(private odoo: OdooClient) {}

  async findAll(query: SearchProductDto) {
    const domain: any[] = [];
    if (query.q) {
      domain.push('|');
      domain.push(['name', 'ilike', query.q]);
      domain.push(['default_code', 'ilike', query.q]);
    }

    const [items, total] = await Promise.all([
      this.odoo.searchRead(
        'product.product',
        domain,
        PRODUCT_FIELDS,
        query.limit,
        query.offset,
      ),
      this.odoo.searchCount('product.product', domain),
    ]);

    return { items, total, limit: query.limit, offset: query.offset };
  }

  async findOne(id: number) {
    const results = await this.odoo.read('product.product', [id], PRODUCT_FIELDS);
    return results[0] ?? null;
  }

  async create(dto: CreateProductDto) {
    const values: Record<string, any> = {
      name: dto.name,
      list_price: dto.list_price,
    };
    if (dto.default_code) values.default_code = dto.default_code;
    if (dto.type) values.type = dto.type;
    if (dto.categ_id) values.categ_id = dto.categ_id;

    const id = await this.odoo.create('product.template', values);
    return { id, ...values };
  }
}
