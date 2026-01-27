import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1763161216859 implements MigrationInterface {
    name = 'Migrations1763161216859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS "api"."my_favorite_stores"`);
        await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "products_store_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "vendor_account"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "vendor_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "address_line1" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "address_line2" text`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "city" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "state" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "postal_code" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "opening_hours" jsonb`);
        await queryRunner.query(`CREATE OR REPLACE VIEW api.my_favorite_stores AS
      SELECT s.*
      FROM core.stores s
      JOIN core.favorite_stores f ON f.store_id = s.id
      WHERE f.account_id = auth.uid()
    `);
        await queryRunner.query(`ALTER TABLE "core"."products" ADD CONSTRAINT "FK_68863607048a1abd43772b314ef" FOREIGN KEY ("store_id") REFERENCES "core"."stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD CONSTRAINT "FK_2f9a0148ed21df5f647efa34433" FOREIGN KEY ("vendor_id") REFERENCES "core"."vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP CONSTRAINT "FK_2f9a0148ed21df5f647efa34433"`);
        await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "FK_68863607048a1abd43772b314ef"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "opening_hours"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "postal_code"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "address_line2"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "address_line1"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "vendor_id"`);
        await queryRunner.query(`CREATE OR REPLACE VIEW api.my_favorite_stores AS
      SELECT s.*
      FROM core.stores s
      JOIN core.favorite_stores f ON f.store_id = s.id
      WHERE f.account_id = auth.uid()
    `);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD "vendor_account" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "core"."products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "core"."stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
