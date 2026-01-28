import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../entities';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditLogsService } from '../audit/audit.service';

type CreateNotificationParams = {
  actorUserId: string;
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationsRepo: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly mailer: MailerService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async listForUser(userId: string, limit = 50, offset = 0) {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notificationsRepo.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepo.save(notification);
    }
    return notification;
  }

  async createForUser(params: CreateNotificationParams) {
    const user = await this.usersService.findById(params.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const notification = this.notificationsRepo.create({
      userId: params.userId,
      type: params.type ?? 'system',
      title: params.title.trim(),
      body: params.body.trim(),
      metadata: params.metadata ?? null,
    });
    const saved = await this.notificationsRepo.save(notification);

    if (params.sendEmail) {
      try {
        await this.mailer.sendNotificationEmail({
          to: user.email,
          subject: params.title,
          body: params.body,
        });
      } catch {
        // Email failures should not block in-app notifications.
      }
    }

    void this.auditLogs.record({
      actorUserId: params.actorUserId,
      action: 'notification_create',
      resourceType: 'notification',
      resourceId: saved.id,
      metadata: { type: saved.type, targetUserId: params.userId, emailSent: Boolean(params.sendEmail) },
    });

    return saved;
  }
}
