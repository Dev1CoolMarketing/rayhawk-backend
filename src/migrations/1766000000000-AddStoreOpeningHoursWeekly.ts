import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreOpeningHoursWeekly1766000000000 implements MigrationInterface {
  name = 'AddStoreOpeningHoursWeekly1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN IF NOT EXISTS "opening_hours_weekly" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN IF EXISTS "opening_hours_weekly"`);
  }
}
