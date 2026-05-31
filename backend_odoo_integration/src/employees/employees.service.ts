import { Injectable, NotFoundException } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';
import { CreateEmployeeDto } from './dto/create-employee.dto';

const EMPLOYEE_FIELDS = [
  'id',
  'name',
  'work_email',
  'work_phone',
  'job_title',
  'department_id',
  'parent_id',
];

@Injectable()
export class EmployeesService {
  constructor(private odoo: OdooClient) {}

  async findAll(limit = 40, offset = 0) {
    const [items, total] = await Promise.all([
      this.odoo.searchRead('hr.employee', [], EMPLOYEE_FIELDS, limit, offset, 'name asc'),
      this.odoo.searchCount('hr.employee', []),
    ]);
    return { items, total, limit, offset };
  }

  async findOne(id: number) {
    const results = await this.odoo.read('hr.employee', [id], EMPLOYEE_FIELDS);
    if (!results[0]) throw new NotFoundException('Employee not found');
    return results[0];
  }

  async create(dto: CreateEmployeeDto) {
    const values: Record<string, any> = { name: dto.name };
    if (dto.work_email) values.work_email = dto.work_email;
    if (dto.work_phone) values.work_phone = dto.work_phone;
    if (dto.job_title) values.job_title = dto.job_title;
    if (dto.department_id) values.department_id = dto.department_id;

    const id = await this.odoo.create('hr.employee', values);
    return this.findOne(id);
  }

  async update(id: number, dto: Partial<CreateEmployeeDto>) {
    const values: Record<string, any> = {};
    if (dto.name) values.name = dto.name;
    if (dto.work_email) values.work_email = dto.work_email;
    if (dto.work_phone) values.work_phone = dto.work_phone;
    if (dto.job_title) values.job_title = dto.job_title;
    if (dto.department_id) values.department_id = dto.department_id;

    await this.odoo.write('hr.employee', [id], values);
    return this.findOne(id);
  }

  async getDepartments() {
    return this.odoo.searchRead('hr.department', [], ['id', 'name', 'manager_id'], 100);
  }
}
