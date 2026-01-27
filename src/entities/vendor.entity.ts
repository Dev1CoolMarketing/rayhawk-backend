import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from './subscription.entity';
import { Store } from './store.entity';

@Entity({ name: 'vendors', schema: 'core' })
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'phone_number', type: 'text', nullable: true })
  phoneNumber?: string | null;

  @Column({ name: 'vendor_image_url', type: 'text', nullable: true })
  vendorImageUrl?: string | null;

  @Column({ name: 'vendor_image_public_id', type: 'text', nullable: true })
  vendorImagePublicId?: string | null;

  @Column({ name: 'stripe_account_id', type: 'text', nullable: true })
  stripeAccountId?: string | null;

  @Column({ type: 'text', default: 'inactive' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.vendor)
  subscriptions?: Subscription[];

  @OneToMany(() => Store, (store) => store.vendor)
  stores?: Store[];
}
