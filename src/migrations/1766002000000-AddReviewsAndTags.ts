import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewsAndTags1766002000000 implements MigrationInterface {
  name = 'AddReviewsAndTags1766002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."review_tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "key" text NOT NULL,
        "label" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_review_tags_key"
      ON "core"."review_tags" ("key")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL REFERENCES "core"."stores"("id") ON DELETE CASCADE,
        "product_id" uuid REFERENCES "core"."products"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "rating" int NOT NULL,
        "criteria_ratings" jsonb,
        "comment" text,
        "status" text NOT NULL DEFAULT 'published',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reviews_store_user_unique"
      ON "core"."reviews" ("store_id", "user_id")
      WHERE "deleted_at" IS NULL AND "product_id" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reviews_product_user_unique"
      ON "core"."reviews" ("product_id", "user_id")
      WHERE "deleted_at" IS NULL AND "product_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."review_tag_links" (
        "review_id" uuid NOT NULL REFERENCES "core"."reviews"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "core"."review_tags"("id") ON DELETE CASCADE,
        PRIMARY KEY ("review_id", "tag_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."review_tag_links"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "core"."IDX_reviews_product_user_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "core"."IDX_reviews_store_user_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."reviews"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "core"."UQ_review_tags_key"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."review_tags"`);
  }
}
