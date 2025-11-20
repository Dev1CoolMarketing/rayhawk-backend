"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUserToAuthUserDto = void 0;
const mapUserToAuthUserDto = (user, vendor, profile, roleOverride) => ({
    id: user.id,
    email: user.email,
    role: roleOverride ?? user.role,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    vendorId: vendor?.id ?? null,
    vendorName: vendor?.name ?? null,
    vendorDescription: vendor?.description ?? null,
    customerProfile: profile
        ? {
            username: profile.username,
            birthYear: profile.birthYear,
        }
        : null,
});
exports.mapUserToAuthUserDto = mapUserToAuthUserDto;
//# sourceMappingURL=auth.mapper.js.map