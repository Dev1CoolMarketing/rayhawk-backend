"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDescriptions1764003000000 = void 0;
class AddDescriptions1764003000000 {
    constructor() {
        this.name = 'AddDescriptions1764003000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN "description" text`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "description" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN "description"`);
    }
}
exports.AddDescriptions1764003000000 = AddDescriptions1764003000000;
//# sourceMappingURL=1764003000000-AddDescriptions.js.map