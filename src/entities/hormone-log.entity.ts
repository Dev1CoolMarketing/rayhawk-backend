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
import { CustomerProfile } from './customer-profile.entity';

export type HormoneFormFactor =
  | 'injection'
  | 'gel'
  | 'cream'
  | 'oral'
  | 'patch'
  | 'pellet'
  | 'nasal'
  | 'other';

@Entity({ name: 'hormone_logs', schema: 'core' })
@Index('IDX_hormone_logs_profile_date', ['customerProfileId', 'dateTaken'])
export class HormoneLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_profile_id', type: 'uuid' })
  customerProfileId!: string;

  @ManyToOne(() => CustomerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_profile_id', referencedColumnName: 'userId' })
  customerProfile?: CustomerProfile;

  @Column({ name: 'testosterone_ng_dl', type: 'numeric', precision: 10, scale: 2 })
  testosteroneNgDl!: number;

  @Column({ name: 'estradiol_pg_ml', type: 'numeric', precision: 10, scale: 2 })
  estradiolPgMl!: number;

  @Column({ name: 'dose_mg', type: 'numeric', precision: 10, scale: 2 })
  doseMg!: number;

  @Column({ name: 'form_factor', type: 'text' })
  formFactor!: HormoneFormFactor;

  @Column({ name: 'date_taken', type: 'date' })
  dateTaken!: string;

  @Column({ name: 'mood_score', type: 'smallint' })
  moodScore!: number;

  @Column({ name: 'mood_notes', type: 'text', nullable: true })
  moodNotes?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
