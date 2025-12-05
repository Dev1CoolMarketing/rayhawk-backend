import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductMetadata1712212800000 implements MigrationInterface {
  name = 'AddProductMetadata1712212800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "unit_count" integer`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "unit_count_type" text`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "form_factor" text`);
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD "billing_type" text NOT NULL DEFAULT 'one_time'`,
    );
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "billing_interval" text`);
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD "billing_quantity" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD CONSTRAINT "chk_products_billing_type" CHECK ("billing_type" IN ('one_time','recurring'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD CONSTRAINT "chk_products_billing_interval" CHECK ("billing_interval" IN ('month','year'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "chk_products_billing_interval"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "chk_products_billing_type"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "billing_quantity"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "billing_interval"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "billing_type"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "form_factor"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "unit_count_type"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "unit_count"`);
  }
}
