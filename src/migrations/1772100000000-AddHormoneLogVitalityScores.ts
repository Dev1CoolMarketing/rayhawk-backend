import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHormoneLogVitalityScores1772100000000 implements MigrationInterface {
  name = 'AddHormoneLogVitalityScores1772100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ADD COLUMN IF NOT EXISTS concentration_sharpness smallint,
        ADD COLUMN IF NOT EXISTS body_composition smallint,
        ADD COLUMN IF NOT EXISTS sleep_quality smallint
    `);

    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ADD CONSTRAINT hormone_logs_concentration_sharpness_check CHECK (concentration_sharpness BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_body_composition_check CHECK (body_composition BETWEEN 0 AND 10),
        ADD CONSTRAINT hormone_logs_sleep_quality_check CHECK (sleep_quality BETWEEN 0 AND 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        DROP CONSTRAINT IF EXISTS hormone_logs_sleep_quality_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_body_composition_check,
        DROP CONSTRAINT IF EXISTS hormone_logs_concentration_sharpness_check
    `);

    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        DROP COLUMN IF EXISTS sleep_quality,
        DROP COLUMN IF EXISTS body_composition,
        DROP COLUMN IF EXISTS concentration_sharpness
    `);
  }
}
