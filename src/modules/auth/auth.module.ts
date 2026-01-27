import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshToken, Vendor } from '../../entities';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { MailerModule } from '../mailer/mailer.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsersModule,
    CustomersModule,
    MailerModule,
    TypeOrmModule.forFeature([RefreshToken, Vendor]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const accessSecret = config.get<string>('JWT_ACCESS_TOKEN_SECRET');
        if (!accessSecret) {
          throw new Error('JWT_ACCESS_TOKEN_SECRET is not configured');
        }
        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: Number(config.get<string>('JWT_ACCESS_TOKEN_TTL_SECONDS')) || 900,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtAuthGuard, LocalAuthGuard, SupabaseAuthService],
  exports: [AuthService, JwtAuthGuard, SupabaseAuthService],
})
export class AuthModule {}
