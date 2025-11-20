"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerProfileRequiredException = void 0;
const common_1 = require("@nestjs/common");
class CustomerProfileRequiredException extends common_1.UnauthorizedException {
    constructor() {
        super({
            message: 'Customer profile required',
            code: 'CUSTOMER_PROFILE_REQUIRED',
        });
    }
}
exports.CustomerProfileRequiredException = CustomerProfileRequiredException;
//# sourceMappingURL=customer-profile-required.exception.js.map