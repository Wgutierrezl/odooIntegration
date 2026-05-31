import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OdooClient } from '../odoo/odoo.client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdooCache } from '../database/entities/odoo-cache.entity';
import { SyncLog } from '../database/entities/sync-log.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private odoo: OdooClient,
    @InjectRepository(OdooCache) private cacheRepo: Repository<OdooCache>,
    @InjectRepository(SyncLog) private logRepo: Repository<SyncLog>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncAll() {
    this.logger.log('Sync started');

    await this.syncModel('crm.stage', ['id', 'name', 'sequence', 'is_won']);
    await this.syncModel('product.category', ['id', 'name', 'parent_id']);
    await this.syncModel('hr.department', ['id', 'name', 'manager_id']);

    this.logger.log('Sync completed');
  }

  private async syncModel(model: string, fields: string[]) {
    const startedAt = new Date();
    try {
      const records = await this.odoo.searchRead(model, [], fields, 500);

      for (const record of records) {
        await this.cacheRepo.upsert(
          {
            model,
            odoo_id: record.id,
            data: JSON.stringify(record),
            synced_at: new Date(),
          },
          ['model', 'odoo_id'],
        );
      }

      await this.logRepo.save({
        model,
        status: 'success',
        records_synced: records.length,
        started_at: startedAt,
        completed_at: new Date(),
      });

      this.logger.log(`Synced ${records.length} records from ${model}`);
    } catch (err) {
      await this.logRepo.save({
        model,
        status: 'error',
        records_synced: 0,
        error_message: err.message,
        started_at: startedAt,
        completed_at: new Date(),
      });

      this.logger.error(`Sync failed for ${model}: ${err.message}`);
    }
  }

  async getStatus() {
    const logs = await this.logRepo.find({
      order: { completed_at: 'DESC' },
      take: 10,
    });
    return { last_syncs: logs };
  }

  async triggerSync() {
    await this.syncAll();
    return { message: 'Manual sync completed' };
  }
}
