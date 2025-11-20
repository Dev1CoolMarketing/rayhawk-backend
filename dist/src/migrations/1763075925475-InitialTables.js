"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialTables1763075925475 = void 0;
class InitialTables1763075925475 {
    constructor() {
        this.name = 'InitialTables1763075925475';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."favorite_stores" DROP CONSTRAINT "favorite_stores_store_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "core"."subscriptions" DROP CONSTRAINT "subscriptions_vendor_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP CONSTRAINT "stores_slug_key"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_790b2968701a6ff5ff38323776" ON "core"."stores" ("slug") `);
        await queryRunner.query(`ALTER TABLE "core"."favorite_stores" ADD CONSTRAINT "FK_47946363b522c49b67fc7795b58" FOREIGN KEY ("store_id") REFERENCES "core"."stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."subscriptions" ADD CONSTRAINT "FK_7ec6f9e18e5ce988063393413ee" FOREIGN KEY ("vendor_id") REFERENCES "core"."vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."subscriptions" DROP CONSTRAINT "FK_7ec6f9e18e5ce988063393413ee"`);
        await queryRunner.query(`ALTER TABLE "core"."favorite_stores" DROP CONSTRAINT "FK_47946363b522c49b67fc7795b58"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_790b2968701a6ff5ff38323776"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD CONSTRAINT "stores_slug_key" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "core"."subscriptions" ADD CONSTRAINT "subscriptions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "core"."vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."favorite_stores" ADD CONSTRAINT "favorite_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "core"."stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
exports.InitialTables1763075925475 = InitialTables1763075925475;
//# sourceMappingURL=1763075925475-InitialTables.js.map