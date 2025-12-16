import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugsAndIndexes1765570000000 implements MigrationInterface {
  name = 'AddSlugsAndIndexes1765570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "slug" text`);
    await queryRunner.query(`
      UPDATE "core"."products"
      SET "slug" = lower(regexp_replace(coalesce("name", "id"::text), '[^a-zA-Z0-9]+', '-', 'g'))
        || '-' || substr("id"::text, 1, 8)
      WHERE "slug" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "core"."products" ALTER COLUMN "slug" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "products_store_slug_active_idx" ON "core"."products" ("store_id", "slug") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_790b2968701a6ff5ff38323776"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "core"."stores_slug_active_idx"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_active_idx" ON "core"."stores" ("slug") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "products_store_slug_active_idx"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "stores_slug_active_idx"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_790b2968701a6ff5ff38323776" ON "core"."stores" ("slug")`,
    );
  }
}
