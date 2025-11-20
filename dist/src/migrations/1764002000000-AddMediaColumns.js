"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMediaColumns1764002000000 = void 0;
class AddMediaColumns1764002000000 {
    constructor() {
        this.name = 'AddMediaColumns1764002000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_url" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_public_id" text`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "image_url" text`);
        await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "image_public_id" text`);
        await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "image_url" text`);
        await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "image_public_id" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "image_public_id"`);
        await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "image_public_id"`);
        await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_public_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    }
}
exports.AddMediaColumns1764002000000 = AddMediaColumns1764002000000;
//# sourceMappingURL=1764002000000-AddMediaColumns.js.map