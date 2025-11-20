"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserNames1764001000000 = void 0;
class AddUserNames1764001000000 {
    constructor() {
        this.name = 'AddUserNames1764001000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "first_name" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "last_name" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
    }
}
exports.AddUserNames1764001000000 = AddUserNames1764001000000;
//# sourceMappingURL=1764001000000-AddUserNames.js.map