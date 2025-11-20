"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
let DbModule = class DbModule {
};
exports.DbModule = DbModule;
exports.DbModule = DbModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    if (!url) {
                        throw new Error('DATABASE_URL is not configured');
                    }
                    const entitiesGlob = [__dirname + '/../**/*.entity{.js,.ts}'];
                    return {
                        type: 'postgres',
                        url,
                        entities: entitiesGlob,
                        synchronize: false,
                        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                        logging: ['error', 'warn'],
                    };
                },
            }),
        ],
    })
], DbModule);
//# sourceMappingURL=db.module.js.map