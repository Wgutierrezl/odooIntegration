import { Injectable } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';
import { CreateContactDto } from './dto/create-contact.dto';
import { SearchContactDto } from './dto/search-contact.dto';

const CONTACT_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'vat',
  'is_company',
  'customer_rank',
  'supplier_rank',
  'city',
  'street',
  'zip',
  'country_id',
  'lang',
  'company_type',
];

@Injectable()
export class ContactsService {
  constructor(private odoo: OdooClient) {}

  private mapContactType(contact: any) {
    return {
      ...contact,
      is_customer: (contact.customer_rank ?? 0) > 0,
      is_supplier: (contact.supplier_rank ?? 0) > 0,
      contact_type:
        (contact.customer_rank ?? 0) > 0 && (contact.supplier_rank ?? 0) > 0
          ? 'customer_supplier'
          : (contact.customer_rank ?? 0) > 0
            ? 'customer'
            : (contact.supplier_rank ?? 0) > 0
              ? 'supplier'
              : 'contact',
    };
  }

  async findAll(query: SearchContactDto) {
    const domain: any[] = [];
    if (query.q) {
      domain.push('|');
      domain.push(['name', 'ilike', query.q]);
      domain.push(['email', 'ilike', query.q]);
    }

    const [items, total] = await Promise.all([
      this.odoo.searchRead('res.partner', domain, CONTACT_FIELDS, query.limit, query.offset),
      this.odoo.searchCount('res.partner', domain),
    ]);

    return {
      items: items.map((i) => this.mapContactType(i)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findCustomers(query: SearchContactDto) {
    const domain: any[] = [['customer_rank', '>', 0]];
    if (query.q) {
      domain.push('|');
      domain.push(['name', 'ilike', query.q]);
      domain.push(['email', 'ilike', query.q]);
    }

    const [items, total] = await Promise.all([
      this.odoo.searchRead('res.partner', domain, CONTACT_FIELDS, query.limit, query.offset),
      this.odoo.searchCount('res.partner', domain),
    ]);

    return { items: items.map((i) => this.mapContactType(i)), total, limit: query.limit, offset: query.offset };
  }

  async findSuppliers(query: SearchContactDto) {
    const domain: any[] = [['supplier_rank', '>', 0]];
    if (query.q) {
      domain.push('|');
      domain.push(['name', 'ilike', query.q]);
      domain.push(['email', 'ilike', query.q]);
    }

    const [items, total] = await Promise.all([
      this.odoo.searchRead('res.partner', domain, CONTACT_FIELDS, query.limit, query.offset),
      this.odoo.searchCount('res.partner', domain),
    ]);

    return { items: items.map((i) => this.mapContactType(i)), total, limit: query.limit, offset: query.offset };
  }

  async findOne(id: number) {
    const results = await this.odoo.read('res.partner', [id], CONTACT_FIELDS);
    return results[0] ? this.mapContactType(results[0]) : null;
  }

  async createCustomer(dto: CreateContactDto) {
    const values: Record<string, any> = {
      name: dto.name,
      customer_rank: 1,
    };
    if (dto.email) values.email = dto.email;
    if (dto.phone) values.phone = dto.phone;
    if (dto.vat) values.vat = dto.vat;
    if (dto.is_company !== undefined) values.is_company = dto.is_company;

    const id = await this.odoo.create('res.partner', values);
    return { id, ...values };
  }

  async createSupplier(dto: CreateContactDto) {
    const values: Record<string, any> = {
      name: dto.name,
      supplier_rank: 1,
    };
    if (dto.email) values.email = dto.email;
    if (dto.phone) values.phone = dto.phone;
    if (dto.vat) values.vat = dto.vat;
    if (dto.is_company !== undefined) values.is_company = dto.is_company;

    const id = await this.odoo.create('res.partner', values);
    return { id, ...values };
  }
}
