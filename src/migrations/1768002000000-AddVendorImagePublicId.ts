import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorImagePublicId1768002000000 implements MigrationInterface {
  name = 'AddVendorImagePublicId1768002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "core"."vendors" ADD "vendor_image_public_id" text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "core"."vendors" DROP COLUMN "vendor_image_public_id"');
  }
}
