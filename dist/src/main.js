"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const body_parser_1 = require("body-parser");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const swagger_1 = require("./infra/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const logger = new common_1.Logger('Bootstrap');
    const configService = app.get(config_1.ConfigService);
    app.enableCors();
    app.use((0, body_parser_1.json)());
    app.use((0, body_parser_1.urlencoded)({ extended: true }));
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.use('/v1/webhooks/stripe', (0, body_parser_1.json)({
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
        limit: '1mb',
        type: '*/*',
    }));
    (0, swagger_1.setupSwagger)(app);
    const port = configService.get('APP_PORT') ?? 8080;
    await app.listen(port);
    logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
