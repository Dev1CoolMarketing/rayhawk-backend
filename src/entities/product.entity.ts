import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity({ name: 'products', schema: 'core' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store?: Store;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents!: number;

  @Column({ name: 'bullet_points', type: 'jsonb', nullable: true })
  bulletPoints?: string[] | null;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ name: 'unit_count', type: 'integer', nullable: true })
  unitCount?: number | null;

  @Column({ name: 'unit_count_type', type: 'text', nullable: true })
  unitCountType?: string | null;

  @Column({ name: 'form_factor', type: 'text', nullable: true })
  formFactor?: string | null;

  @Column({ name: 'billing_type', type: 'text', nullable: true })
  billingType?: string | null;

  @Column({ name: 'billing_interval', type: 'text', nullable: true })
  billingInterval?: string | null;

  @Column({ name: 'billing_quantity', type: 'integer', nullable: true })
  billingQuantity?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  categories?: { key: string; label: string }[] | null;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'image_public_id', type: 'text', nullable: true })
  imagePublicId?: string | null;

  @Column({ name: 'link_url', type: 'text', nullable: true })
  linkUrl?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
