import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Review } from './review.entity';

@Entity({ name: 'review_tags', schema: 'core' })
@Unique(['key'])
export class ReviewTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  label!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToMany(() => Review, (review) => review.tags)
  reviews?: Review[];
}
