import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductDetails1769001000000 implements MigrationInterface {
  name = 'AddProductDetails1769001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "bullet_points" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "unit_count" integer`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "unit_count_type" text`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "form_factor" text`);
    await queryRunner.query(
      `ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "billing_type" text DEFAULT 'one_time'`,
    );
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "billing_interval" text`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "billing_quantity" integer`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN IF NOT EXISTS "categories" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "categories"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "billing_quantity"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "billing_interval"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "billing_type"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "form_factor"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "unit_count_type"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "unit_count"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "featured"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN IF EXISTS "bullet_points"`);
  }
}
