import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdjustUsersAndRefreshTokens1764000500000 implements MigrationInterface {
  name = 'AdjustUsersAndRefreshTokens1764000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_id"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "refresh_tokens" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" TYPE character varying(32)`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" SET NOT NULL`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'refresh_tokens'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_3ddc983c5f7bcf132fd8732c3f4'
        ) THEN
          ALTER TABLE "refresh_tokens"
          ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_3ddc983c5f7bcf132fd8732c3f4"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" SET NOT NULL`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'refresh_tokens'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_refresh_tokens_user_id'
        ) THEN
          ALTER TABLE "refresh_tokens"
          ADD CONSTRAINT "FK_refresh_tokens_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }
}
