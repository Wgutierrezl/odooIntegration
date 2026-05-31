import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { OdooCache } from '../database/entities/odoo-cache.entity';
import { SyncLog } from '../database/entities/sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OdooCache, SyncLog])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
