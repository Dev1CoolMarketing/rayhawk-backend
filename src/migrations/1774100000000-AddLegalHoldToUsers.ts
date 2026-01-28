import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegalHoldToUsers1774100000000 implements MigrationInterface {
  name = 'AddLegalHoldToUsers1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS legal_hold_reason text`);
    await queryRunner.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS legal_hold_set_at timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE public.users DROP COLUMN IF EXISTS legal_hold_set_at`);
    await queryRunner.query(`ALTER TABLE public.users DROP COLUMN IF EXISTS legal_hold_reason`);
    await queryRunner.query(`ALTER TABLE public.users DROP COLUMN IF EXISTS legal_hold`);
  }
}
