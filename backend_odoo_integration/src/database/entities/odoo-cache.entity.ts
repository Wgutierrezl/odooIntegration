import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity('odoo_cache')
@Unique(['model', 'odoo_id'])
export class OdooCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  model: string;

  @Column()
  odoo_id: number;

  @Column('text')
  data: string;

  @Column()
  synced_at: Date;
}
