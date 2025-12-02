import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { BillingCustomer } from './billing-customer.entity';
import { BillingPlan } from './billing-plan.entity';
import { BillingInvoice } from './billing-invoice.entity';
import { BillingSubscriptionItem } from './billing-subscription-item.entity';
import { BillingSubscriptionStatus } from '../modules/billing/types/billing.types';

@Entity({ name: 'billing_subscriptions', schema: 'billing' })
export class BillingSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ name: 'billing_customer_id', type: 'uuid', nullable: true })
  billingCustomerId?: string | null;

  @ManyToOne(() => BillingCustomer, (customer) => customer.subscriptions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billing_customer_id' })
  billingCustomer?: BillingCustomer | null;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId?: string | null;

  @ManyToOne(() => BillingPlan, (plan) => plan.subscriptions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan?: BillingPlan | null;

  @Index({ unique: true })
  @Column({ name: 'stripe_subscription_id', type: 'text' })
  stripeSubscriptionId!: string;

  @Column({ name: 'stripe_price_id', type: 'text' })
  stripePriceId!: string;

  @Column({ type: 'text', default: 'incomplete' })
  status!: BillingSubscriptionStatus;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart?: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date | null;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ name: 'trial_end', type: 'timestamptz', nullable: true })
  trialEnd?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BillingInvoice, (invoice) => invoice.subscription)
  invoices?: BillingInvoice[];

  @OneToMany(() => BillingSubscriptionItem, (item) => item.subscription, { cascade: true })
  items?: BillingSubscriptionItem[];
}
