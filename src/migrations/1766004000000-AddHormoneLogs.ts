import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHormoneLogs1766004000000 implements MigrationInterface {
  name = 'AddHormoneLogs1766004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."hormone_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer_profile_id" uuid NOT NULL REFERENCES "core"."customer_profiles"("user_id") ON DELETE CASCADE,
        "log_type" text NOT NULL DEFAULT 'monthly',
        "testosterone_ng_dl" numeric(10, 2),
        "estradiol_pg_ml" numeric(10, 2),
        "dose_mg" numeric(10, 2),
        "form_factor" text,
        "date_taken" timestamptz NOT NULL DEFAULT now(),
        "mood_score" smallint,
        "mood_notes" text,
        "erection_strength" smallint,
        "morning_erections" smallint,
        "libido" smallint,
        "sexual_thoughts" smallint,
        "energy_levels" smallint,
        "mood_stability" smallint,
        "strength_endurance" smallint,
        "concentration_sharpness" smallint,
        "body_composition" smallint,
        "sleep_quality" smallint,
        "exercise_duration_minutes" int,
        "exercise_intensity" text,
        "sleep_hours" numeric(4, 1),
        "stress_level" smallint,
        "weight_lbs" numeric(6, 1),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_hormone_logs_profile_date"
      ON "core"."hormone_logs" ("customer_profile_id", "date_taken")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "core"."IDX_hormone_logs_profile_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."hormone_logs"`);
  }
}
