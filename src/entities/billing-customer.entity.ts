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
import { BillingSubscription } from './billing-subscription.entity';

@Entity({ name: 'billing_customers', schema: 'billing' })
export class BillingCustomer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_id', type: 'uuid', unique: true })
  vendorId!: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Index({ unique: true })
  @Column({ name: 'stripe_customer_id', type: 'text' })
  stripeCustomerId!: string;

  @Column({ type: 'text', nullable: true })
  email?: string | null;

  @Column({ name: 'billing_name', type: 'text', nullable: true })
  billingName?: string | null;

  @Column({ name: 'default_payment_method_brand', type: 'text', nullable: true })
  defaultPaymentMethodBrand?: string | null;

  @Column({ name: 'default_payment_method_last4', type: 'text', nullable: true })
  defaultPaymentMethodLast4?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BillingSubscription, (subscription) => subscription.billingCustomer)
  subscriptions?: BillingSubscription[];
}
