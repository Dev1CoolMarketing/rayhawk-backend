import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingPlanLimits1766006000000 implements MigrationInterface {
  name = 'AddBillingPlanLimits1766006000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE billing.billing_plans
      ADD COLUMN IF NOT EXISTS seats_included integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE billing.billing_plans
      ADD COLUMN IF NOT EXISTS max_stores integer
    `);
    await queryRunner.query(`
      ALTER TABLE billing.billing_plans
      ADD COLUMN IF NOT EXISTS seat_unit_cents integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE billing.billing_plans DROP COLUMN IF EXISTS seat_unit_cents`);
    await queryRunner.query(`ALTER TABLE billing.billing_plans DROP COLUMN IF EXISTS max_stores`);
    await queryRunner.query(`ALTER TABLE billing.billing_plans DROP COLUMN IF EXISTS seats_included`);
  }
}
