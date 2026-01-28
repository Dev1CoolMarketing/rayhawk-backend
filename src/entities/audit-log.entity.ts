import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs', schema: 'core' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @Index()
  @Column({ type: 'text' })
  action!: string;

  @Index()
  @Column({ name: 'resource_type', type: 'text' })
  resourceType!: string;

  @Index()
  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
