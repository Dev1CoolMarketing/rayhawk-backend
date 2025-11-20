import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity({ name: 'subscriptions', schema: 'core' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ name: 'stripe_customer_id', type: 'text', nullable: true })
  stripeCustomerId?: string | null;

  @Column({ name: 'stripe_subscription_id', type: 'text', nullable: true, unique: true })
  stripeSubscriptionId?: string | null;

  @Column({ type: 'text', default: 'inactive' })
  status!: string;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
