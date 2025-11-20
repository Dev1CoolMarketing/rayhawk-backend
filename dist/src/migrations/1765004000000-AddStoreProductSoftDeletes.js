"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddStoreProductSoftDeletes1765004000000 = void 0;
class AddStoreProductSoftDeletes1765004000000 {
    constructor() {
        this.name = 'AddStoreProductSoftDeletes1765004000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "deleted_at"`);
    }
}
exports.AddStoreProductSoftDeletes1765004000000 = AddStoreProductSoftDeletes1765004000000;
//# sourceMappingURL=1765004000000-AddStoreProductSoftDeletes.js.map