"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProductLinkUrl1765100000000 = void 0;
class AddProductLinkUrl1765100000000 {
    constructor() {
        this.name = 'AddProductLinkUrl1765100000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "link_url" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "link_url"`);
    }
}
exports.AddProductLinkUrl1765100000000 = AddProductLinkUrl1765100000000;
//# sourceMappingURL=1765100000000-AddProductLinkUrl.js.map