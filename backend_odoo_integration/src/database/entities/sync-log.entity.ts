import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sync_log')
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  model: string;

  @Column()
  status: string;

  @Column({ default: 0 })
  records_synced: number;

  @Column({ nullable: true, type: 'text' })
  error_message: string;

  @Column()
  started_at: Date;

  @Column()
  completed_at: Date;
}
