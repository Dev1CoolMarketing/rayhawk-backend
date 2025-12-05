import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { ProductCategory } from './product-category.entity';

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

  @Column({ name: 'unit_count', type: 'integer', nullable: true })
  unitCount?: number | null;

  @Column({ name: 'unit_count_type', type: 'text', nullable: true })
  unitCountType?: string | null;

  @Column({ name: 'form_factor', type: 'text', nullable: true })
  formFactor?: string | null;

  @Column({
    name: 'billing_type',
    type: 'text',
    default: 'one_time',
  })
  billingType!: 'one_time' | 'recurring';

  @Column({ name: 'billing_interval', type: 'text', nullable: true })
  billingInterval?: 'month' | 'year' | null;

  @Column({ name: 'billing_quantity', type: 'integer', default: 1 })
  billingQuantity!: number;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'image_public_id', type: 'text', nullable: true })
  imagePublicId?: string | null;

  @Column({ name: 'link_url', type: 'text', nullable: true })
  linkUrl?: string | null;

  @Column({ name: 'bullet_points', type: 'text', array: true, nullable: true })
  bulletPoints?: string[] | null;

  @Column({ name: 'featured', type: 'boolean', default: false })
  featured!: boolean;

  @ManyToMany(() => ProductCategory, (category) => category.products, { eager: true })
  @JoinTable({
    name: 'product_category_links',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories?: ProductCategory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
