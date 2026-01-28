import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../entities';
import { AuditModule } from '../audit/audit.module';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UsersModule, MailerModule, AuditModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
