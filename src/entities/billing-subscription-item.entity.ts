import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingSubscription } from './billing-subscription.entity';
import { Vendor } from './vendor.entity';

@Entity({ name: 'billing_subscription_items', schema: 'billing' })
@Index('IDX_billing_subscription_item_subscription_price', ['billingSubscriptionId', 'stripePriceId'], {
  unique: true,
})
export class BillingSubscriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'billing_subscription_id', type: 'uuid' })
  billingSubscriptionId!: string;

  @ManyToOne(() => BillingSubscription, (subscription) => subscription.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billing_subscription_id' })
  subscription?: BillingSubscription;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ name: 'stripe_price_id', type: 'text' })
  stripePriceId!: string;

  @Column({ name: 'stripe_product_id', type: 'text', nullable: true })
  stripeProductId?: string | null;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ name: 'feature_type', type: 'text', nullable: true })
  featureType?: string | null;

  @Column({ name: 'units_per_quantity', type: 'integer', default: 1 })
  unitsPerQuantity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
