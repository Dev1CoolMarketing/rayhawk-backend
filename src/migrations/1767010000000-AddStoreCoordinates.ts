import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreCoordinates1767010000000 implements MigrationInterface {
  name = 'AddStoreCoordinates1767010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(`
      ALTER TABLE core.stores
      ADD COLUMN IF NOT EXISTS latitude double precision,
      ADD COLUMN IF NOT EXISTS longitude double precision
    `);

    await queryRunner.query(`
      ALTER TABLE core.stores
      ADD COLUMN IF NOT EXISTS coordinates geography(Point, 4326)
        GENERATED ALWAYS AS (
          CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
              THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            ELSE NULL
          END
        ) STORED
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_coordinates_gix
        ON core.stores
        USING GIST (coordinates)
        WHERE coordinates IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_stores_coordinates_gix`);
    await queryRunner.query(`ALTER TABLE core.stores DROP COLUMN IF EXISTS coordinates`);
    await queryRunner.query(`
      ALTER TABLE core.stores
      DROP COLUMN IF EXISTS latitude,
      DROP COLUMN IF EXISTS longitude
    `);
  }
}
