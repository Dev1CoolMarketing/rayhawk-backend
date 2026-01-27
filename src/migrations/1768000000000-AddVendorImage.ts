import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorImage1768000000000 implements MigrationInterface {
  name = 'AddVendorImage1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD "vendor_image_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN "vendor_image_url"`);
  }
}
