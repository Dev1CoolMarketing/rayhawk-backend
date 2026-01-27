import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHormoneLogDateTakenToTimestamp1772000000000 implements MigrationInterface {
  name = 'UpdateHormoneLogDateTakenToTimestamp1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ALTER COLUMN date_taken TYPE timestamptz USING date_taken::timestamptz,
        ALTER COLUMN date_taken SET DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.hormone_logs
        ALTER COLUMN date_taken TYPE date USING date_taken::date,
        ALTER COLUMN date_taken SET DEFAULT CURRENT_DATE
    `);
  }
}
