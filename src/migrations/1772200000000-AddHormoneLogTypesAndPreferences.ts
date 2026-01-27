import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHormoneLogTypesAndPreferences1772200000000 implements MigrationInterface {
  name = 'AddHormoneLogTypesAndPreferences1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."hormone_logs" ADD COLUMN "log_type" text NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "testosterone_ng_dl" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "estradiol_pg_ml" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "dose_mg" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "form_factor" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "mood_score" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ADD COLUMN "exercise_duration_minutes" int`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ADD COLUMN "exercise_intensity" text`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ADD COLUMN "sleep_hours" numeric(4,1)`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ADD COLUMN "stress_level" smallint`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ADD COLUMN "weight_lbs" numeric(6,1)`);
    await queryRunner.query(
      `ALTER TABLE "core"."customer_profiles" ADD COLUMN "vitality_preferences" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."customer_profiles" DROP COLUMN "vitality_preferences"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "weight_lbs"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "stress_level"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "sleep_hours"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "exercise_intensity"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "exercise_duration_minutes"`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "mood_score" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "form_factor" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "dose_mg" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "estradiol_pg_ml" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" ALTER COLUMN "testosterone_ng_dl" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."hormone_logs" DROP COLUMN "log_type"`);
  }
}
