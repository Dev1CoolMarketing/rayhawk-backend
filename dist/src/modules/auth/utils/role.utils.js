"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignableRoles = getAssignableRoles;
function getAssignableRoles(user) {
    const roles = new Set([user.role]);
    if (user.customerProfile) {
        roles.add('customer');
    }
    return roles;
}
//# sourceMappingURL=role.utils.js.map