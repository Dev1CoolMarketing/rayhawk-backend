"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const setupSwagger = (app) => {
    const configService = app.get(config_1.ConfigService);
    const appName = configService.get('PROJECT_NAME') ?? 'rayhawk-backend';
    const config = new swagger_1.DocumentBuilder()
        .setTitle(appName)
        .setDescription('Rayhawk REST API')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'First-party access token issued by the Auth module',
    }, 'bearer')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('v1/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.js.map