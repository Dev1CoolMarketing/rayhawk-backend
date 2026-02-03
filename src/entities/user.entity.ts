import { UserRole } from '../modules/auth/types/auth.types';
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { CustomerProfile } from './customer-profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'text', nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'text', nullable: true })
  lastName?: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'avatar_public_id', type: 'text', nullable: true })
  avatarPublicId?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'user' })
  role!: UserRole;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion!: number;

  @Column({ name: 'legal_hold', type: 'boolean', default: false })
  legalHold!: boolean;

  @Column({ name: 'legal_hold_reason', type: 'text', nullable: true })
  legalHoldReason?: string | null;

  @Column({ name: 'legal_hold_set_at', type: 'timestamptz', nullable: true })
  legalHoldSetAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens?: RefreshToken[];

  @OneToOne(() => CustomerProfile, (profile) => profile.user)
  customerProfile?: CustomerProfile;
}
