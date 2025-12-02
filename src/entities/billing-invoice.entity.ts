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
import { Vendor } from './vendor.entity';
import { BillingSubscription } from './billing-subscription.entity';

@Entity({ name: 'billing_invoices', schema: 'billing' })
export class BillingInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ name: 'billing_subscription_id', type: 'uuid', nullable: true })
  billingSubscriptionId?: string | null;

  @ManyToOne(() => BillingSubscription, (subscription) => subscription.invoices, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billing_subscription_id' })
  subscription?: BillingSubscription | null;

  @Index({ unique: true })
  @Column({ name: 'stripe_invoice_id', type: 'text' })
  stripeInvoiceId!: string;

  @Column({ name: 'stripe_invoice_number', type: 'text', nullable: true })
  stripeInvoiceNumber?: string | null;

  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true })
  hostedInvoiceUrl?: string | null;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl?: string | null;

  @Column({ name: 'amount_paid_cents', type: 'integer', nullable: true })
  amountPaidCents?: number | null;

  @Column({ type: 'text', default: 'usd' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  status?: string | null;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt?: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
