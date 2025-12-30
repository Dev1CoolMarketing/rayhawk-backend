import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type VitalityTrackingPreferences = {
  includeTestosterone?: boolean;
  includeExercise?: boolean;
  includeSleep?: boolean;
  includeStress?: boolean;
  includeWeight?: boolean;
};

@Entity({ name: 'customer_profiles', schema: 'core' })
export class CustomerProfile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.customerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'username', type: 'text', unique: true })
  username!: string;

  @Column({ name: 'birth_year', type: 'int' })
  birthYear!: number;

  @Column({ name: 'vitality_preferences', type: 'jsonb', default: () => "'{}'" })
  vitalityPreferences!: VitalityTrackingPreferences;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
