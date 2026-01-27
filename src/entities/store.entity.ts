import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FavoriteStore } from './favorite-store.entity';
import { Product } from './product.entity';
import { Review } from './review.entity';
import { Vendor } from './vendor.entity';

@Entity({ name: 'stores', schema: 'core' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Column({ name: 'address_line1', type: 'text' })
  addressLine1!: string;

  @Column({ name: 'address_line2', type: 'text', nullable: true })
  addressLine2?: string | null;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text' })
  state!: string;

  @Column({ name: 'postal_code', type: 'text' })
  postalCode!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'image_public_id', type: 'text', nullable: true })
  imagePublicId?: string | null;

  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  openingHours?: string[] | null;

  @Column({ name: 'opening_hours_weekly', type: 'jsonb', nullable: true })
  openingHoursWeekly?: Record<string, { start: number; end: number }[]> | null;

  @Column({ type: 'text', default: 'America/Los_Angeles' })
  timezone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => FavoriteStore, (favorite) => favorite.store)
  favorites?: FavoriteStore[];

  @OneToMany(() => Product, (product) => product.store)
  products?: Product[];

  @OneToMany(() => Review, (review) => review.store)
  reviews?: Review[];
}
