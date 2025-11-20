import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'lead_credits', schema: 'core' })
export class LeadCredit {
  @PrimaryColumn({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'integer', default: 0 })
  credits!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
