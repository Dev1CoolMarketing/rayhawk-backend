import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerProfilesAndFavorites1765101000000 implements MigrationInterface {
  name = 'AddCustomerProfilesAndFavorites1765101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."customer_profiles" (
        "user_id" uuid PRIMARY KEY REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "username" text NOT NULL UNIQUE,
        "birth_year" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`ALTER TABLE "core"."favorite_stores" RENAME COLUMN "account_id" TO "user_id"`);
    await queryRunner.query(`ALTER TABLE "core"."favorite_stores" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_select ON "core"."favorite_stores"`);
    await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_insert ON "core"."favorite_stores"`);
    await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_delete ON "core"."favorite_stores"`);

    await queryRunner.query(`
      ALTER TABLE "core"."favorite_stores"
      ADD CONSTRAINT "FK_favorite_store_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."favorite_stores" DROP CONSTRAINT "FK_favorite_store_user"`);
    await queryRunner.query(`ALTER TABLE "core"."favorite_stores" RENAME COLUMN "user_id" TO "account_id"`);
    await queryRunner.query(`DROP TABLE "core"."customer_profiles"`);
  }
}
