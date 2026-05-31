import { Controller, Get, UseGuards } from '@nestjs/common';
import { OdooClient } from './odoo.client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('health')
export class OdooHealthController {
  constructor(private odoo: OdooClient) {}

  @Get('odoo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async checkOdoo() {
    try {
      const version = await this.odoo.getVersion();
      return {
        status: 'connected',
        uid: this.odoo.isConnected(),
        version: version?.server_version ?? 'unknown',
      };
    } catch (err) {
      return {
        status: 'disconnected',
        error: err.message,
      };
    }
  }
}
