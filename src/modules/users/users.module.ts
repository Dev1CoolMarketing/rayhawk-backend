import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile, FavoriteStore, HormoneLog, Review, Store, User } from '../../entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MediaModule } from '../media/media.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, CustomerProfile, HormoneLog, FavoriteStore, Store, Review]), MediaModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
