import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { RefreshToken, User } from '../src/entities';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const pgMem = newDb({ autoCreateForeignKeyIndices: true });
    pgMem.public.registerFunction({
      name: 'uuid_generate_v4',
      implementation: () => randomUUID(),
    });
    pgMem.public.registerFunction({
      name: 'current_database',
      implementation: () => 'test',
    });
    pgMem.public.registerFunction({
      name: 'version',
      implementation: () => 'PostgreSQL 14.0 on pg-mem',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: async () => ({
            type: 'postgres',
            entities: [User, RefreshToken],
            synchronize: true,
          }),
          dataSourceFactory: async (options) => {
            const dataSource = pgMem.adapters.createTypeormDataSource(options);
            await dataSource.initialize();
            return dataSource;
          },
        }),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, accesses /me, and refreshes tokens', async () => {
    const server = app.getHttpServer();
    const credentials = { email: 'e2e-user@example.com', password: 'Password1!' };

    const registerResponse = await request(server).post('/v1/auth/register').send(credentials).expect(201);
    expect(registerResponse.body.accessToken).toBeDefined();
    expect(registerResponse.body.refreshToken).toBeDefined();

    const loginResponse = await request(server).post('/v1/auth/login').send(credentials).expect(201);
    expect(loginResponse.body.user.email).toEqual(credentials.email);

    const meResponse = await request(server)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);
    expect(meResponse.body.email).toEqual(credentials.email);

    const refreshResponse = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(201);
    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.refreshToken).not.toEqual(loginResponse.body.refreshToken);
  });
});
