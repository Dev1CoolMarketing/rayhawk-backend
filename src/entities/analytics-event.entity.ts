import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'analytics_events', schema: 'analytics' })
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @Index()
  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @Index()
  @Column({ type: 'text' })
  type!:
    | 'page_view'
    | 'click_through'
    | 'product_view'
    | 'product_click'
    | 'search'
    | 'favorite_add'
    | 'favorite_remove'
    | 'review_submit';

  @Column({ name: 'referrer', type: 'text', nullable: true })
  referrer?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ name: 'session_id', type: 'text', nullable: true })
  sessionId?: string | null;

  @Column({ name: 'ip_hash', type: 'text', nullable: true })
  ipHash?: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Index()
  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'now()' })
  occurredAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
