import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHormoneLogs1766009500000 implements MigrationInterface {
  name = 'AddHormoneLogs1766009500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.hormone_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_profile_id uuid NOT NULL REFERENCES core.customer_profiles(user_id) ON DELETE CASCADE,
        testosterone_ng_dl numeric(10,2) NOT NULL,
        estradiol_pg_ml numeric(10,2) NOT NULL,
        dose_mg numeric(10,2) NOT NULL,
        form_factor text NOT NULL CHECK (form_factor IN ('injection','gel','cream','oral','patch','pellet','nasal','other')),
        date_taken date NOT NULL DEFAULT CURRENT_DATE,
        mood_score smallint NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
        mood_notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_hormone_logs_profile_date ON core.hormone_logs(customer_profile_id, date_taken DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hormone_logs_profile_date`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.hormone_logs`);
  }
}
