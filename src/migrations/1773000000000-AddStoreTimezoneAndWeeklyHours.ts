import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreTimezoneAndWeeklyHours1773000000000 implements MigrationInterface {
  name = 'AddStoreTimezoneAndWeeklyHours1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."stores" ADD "timezone" text NOT NULL DEFAULT 'America/Los_Angeles'`,
    );
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD "opening_hours_weekly" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "opening_hours_weekly"`);
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "timezone"`);
  }
}
