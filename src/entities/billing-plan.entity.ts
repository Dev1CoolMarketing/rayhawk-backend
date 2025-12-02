import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BillingSubscription } from './billing-subscription.entity';
import { BillingInterval } from '../modules/billing/types/billing.types';

@Entity({ name: 'billing_plans', schema: 'billing' })
export class BillingPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Index({ unique: true })
  @Column({ name: 'stripe_price_id', type: 'text' })
  stripePriceId!: string;

  @Column({ name: 'stripe_product_id', type: 'text', nullable: true })
  stripeProductId?: string | null;

  @Column({ type: 'text' })
  interval!: BillingInterval;

  @Column({ type: 'text', default: 'usd' })
  currency!: string;

  @Column({ name: 'unit_amount_cents', type: 'integer' })
  unitAmountCents!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'seats_included', type: 'integer', default: 1 })
  seatsIncluded!: number;

  @Column({ name: 'max_stores', type: 'integer', nullable: true })
  maxStores?: number | null;

  @Column({ name: 'seat_unit_cents', type: 'integer', nullable: true })
  seatUnitCents?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BillingSubscription, (subscription) => subscription.plan)
  subscriptions?: BillingSubscription[];
}
