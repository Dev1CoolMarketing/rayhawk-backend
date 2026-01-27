import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorPhone1766008100000 implements MigrationInterface {
  name = 'AddVendorPhone1766008100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN IF NOT EXISTS "phone_number" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN IF EXISTS "phone_number"`);
  }
}
