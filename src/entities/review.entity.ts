import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { User } from './user.entity';
import { ReviewTag } from './review-tag.entity';
import { Product } from './product.entity';

@Entity({ name: 'reviews', schema: 'core' })
@Index(['storeId', 'userId'], { unique: true, where: '"deleted_at" IS NULL AND "product_id" IS NULL' })
@Index(['productId', 'userId'], { unique: true, where: '"deleted_at" IS NULL AND "product_id" IS NOT NULL' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store?: Store;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ type: 'text', default: 'published' })
  status!: string;

  @ManyToMany(() => ReviewTag, (tag) => tag.reviews, { eager: true })
  @JoinTable({
    name: 'review_tag_links',
    joinColumn: { name: 'review_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: ReviewTag[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
