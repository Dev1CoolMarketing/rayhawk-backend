import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHormoneLogEnergyScores1771000000000 implements MigrationInterface {
  name = 'AddHormoneLogEnergyScores1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ADD COLUMN IF NOT EXISTS erection_strength smallint,
        ADD COLUMN IF NOT EXISTS morning_erections smallint,
        ADD COLUMN IF NOT EXISTS libido smallint,
        ADD COLUMN IF NOT EXISTS sexual_thoughts smallint,
        ADD COLUMN IF NOT EXISTS energy_levels smallint,
        ADD COLUMN IF NOT EXISTS mood_stability smallint,
        ADD COLUMN IF NOT EXISTS strength_endurance smallint
    `);

    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ADD CONSTRAINT hormone_logs_erection_strength_check CHECK (erection_strength BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_morning_erections_check CHECK (morning_erections BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_libido_check CHECK (libido BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_sexual_thoughts_check CHECK (sexual_thoughts BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_energy_levels_check CHECK (energy_levels BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_mood_stability_check CHECK (mood_stability BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_strength_endurance_check CHECK (strength_endurance BETWEEN 0 AND 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        DROP CONSTRAINT IF EXISTS hormone_logs_strength_endurance_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_mood_stability_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_energy_levels_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_sexual_thoughts_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_libido_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_morning_erections_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_erection_strength_check
    `);

    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        DROP COLUMN IF EXISTS strength_endurance,
        DROP COLUMN IF EXISTS mood_stability,
        DROP COLUMN IF EXISTS energy_levels,
        DROP COLUMN IF EXISTS sexual_thoughts,
        DROP COLUMN IF EXISTS libido,
        DROP COLUMN IF EXISTS morning_erections,
        DROP COLUMN IF EXISTS erection_strength
    `);
  }
}
