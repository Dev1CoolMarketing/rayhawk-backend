"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_module_1 = require("./infra/bullmq.module");
const db_module_1 = require("./infra/db.module");
const health_module_1 = require("./modules/health/health.module");
const stores_module_1 = require("./modules/stores/stores.module");
const favorites_module_1 = require("./modules/favorites/favorites.module");
const billing_module_1 = require("./modules/billing/billing.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const reports_module_1 = require("./modules/reports/reports.module");
const products_module_1 = require("./modules/products/products.module");
const users_module_1 = require("./modules/users/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
const vendors_module_1 = require("./modules/vendors/vendors.module");
const customers_module_1 = require("./modules/customers/customers.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, cache: true }),
            db_module_1.DbModule,
            bullmq_module_1.BullMqModule,
            health_module_1.HealthModule,
            stores_module_1.StoresModule,
            favorites_module_1.FavoritesModule,
            billing_module_1.BillingModule,
            webhooks_module_1.WebhooksModule,
            jobs_module_1.JobsModule,
            reports_module_1.ReportsModule,
            products_module_1.ProductsModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            vendors_module_1.VendorsModule,
            customers_module_1.CustomersModule,
        ],
    })
], AppModule);
