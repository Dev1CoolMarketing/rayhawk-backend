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

export type HormoneLogType = 'monthly' | 'vitality';

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

  @Column({ name: 'log_type', type: 'text', default: 'monthly' })
  logType!: HormoneLogType;

  @Column({ name: 'testosterone_ng_dl', type: 'numeric', precision: 10, scale: 2, nullable: true })
  testosteroneNgDl?: number | null;

  @Column({ name: 'estradiol_pg_ml', type: 'numeric', precision: 10, scale: 2, nullable: true })
  estradiolPgMl?: number | null;

  @Column({ name: 'dose_mg', type: 'numeric', precision: 10, scale: 2, nullable: true })
  doseMg?: number | null;

  @Column({ name: 'form_factor', type: 'text', nullable: true })
  formFactor?: HormoneFormFactor | null;

  @Column({ name: 'date_taken', type: 'timestamptz', default: () => 'now()' })
  dateTaken!: Date;

  @Column({ name: 'mood_score', type: 'smallint', nullable: true })
  moodScore?: number | null;

  @Column({ name: 'mood_notes', type: 'text', nullable: true })
  moodNotes?: string | null;

  @Column({ name: 'erection_strength', type: 'smallint', nullable: true })
  erectionStrength?: number | null;

  @Column({ name: 'morning_erections', type: 'smallint', nullable: true })
  morningErections?: number | null;

  @Column({ name: 'libido', type: 'smallint', nullable: true })
  libido?: number | null;

  @Column({ name: 'sexual_thoughts', type: 'smallint', nullable: true })
  sexualThoughts?: number | null;

  @Column({ name: 'energy_levels', type: 'smallint', nullable: true })
  energyLevels?: number | null;

  @Column({ name: 'mood_stability', type: 'smallint', nullable: true })
  moodStability?: number | null;

  @Column({ name: 'strength_endurance', type: 'smallint', nullable: true })
  strengthEndurance?: number | null;

  @Column({ name: 'concentration_sharpness', type: 'smallint', nullable: true })
  concentrationSharpness?: number | null;

  @Column({ name: 'body_composition', type: 'smallint', nullable: true })
  bodyComposition?: number | null;

  @Column({ name: 'sleep_quality', type: 'smallint', nullable: true })
  sleepQuality?: number | null;

  @Column({ name: 'exercise_duration_minutes', type: 'int', nullable: true })
  exerciseDurationMinutes?: number | null;

  @Column({ name: 'exercise_intensity', type: 'text', nullable: true })
  exerciseIntensity?: string | null;

  @Column({ name: 'sleep_hours', type: 'numeric', precision: 4, scale: 1, nullable: true })
  sleepHours?: number | null;

  @Column({ name: 'stress_level', type: 'smallint', nullable: true })
  stressLevel?: number | null;

  @Column({ name: 'weight_lbs', type: 'numeric', precision: 6, scale: 1, nullable: true })
  weightLbs?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
