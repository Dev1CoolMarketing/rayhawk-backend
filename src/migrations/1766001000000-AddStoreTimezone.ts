import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreTimezone1766001000000 implements MigrationInterface {
  name = 'AddStoreTimezone1766001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."stores"
      ADD COLUMN IF NOT EXISTS "timezone" text NOT NULL DEFAULT 'America/Los_Angeles'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN IF EXISTS "timezone"`);
  }
}
