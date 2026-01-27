import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorProfileFields1769000000000 implements MigrationInterface {
  name = 'AddVendorProfileFields1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN IF NOT EXISTS "phone_number" text`);
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN IF NOT EXISTS "vendor_image_url" text`);
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN IF NOT EXISTS "vendor_image_public_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN IF EXISTS "vendor_image_public_id"`);
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN IF EXISTS "vendor_image_url"`);
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN IF EXISTS "phone_number"`);
  }
}
