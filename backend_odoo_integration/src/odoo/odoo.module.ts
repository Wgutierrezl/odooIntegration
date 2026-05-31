import { Module, Global } from '@nestjs/common';
import { OdooClient } from './odoo.client';
import { OdooHealthController } from './odoo-health.controller';

@Global()
@Module({
  providers: [OdooClient],
  controllers: [OdooHealthController],
  exports: [OdooClient],
})
export class OdooModule {}
