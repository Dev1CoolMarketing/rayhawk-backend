import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL is not configured');
        }
        const entitiesGlob = [__dirname + '/../**/*.entity{.js,.ts}'];
        return {
          type: 'postgres' as const,
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
export class DbModule {}
