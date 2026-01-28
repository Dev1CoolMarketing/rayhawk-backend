import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType = 'breach' | 'security' | 'privacy' | 'system';

@Entity({ name: 'notifications', schema: 'core' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text', default: 'system' })
  type!: NotificationType;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Index()
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
