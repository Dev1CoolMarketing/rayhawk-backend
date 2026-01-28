import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me')
  async list(
    @User() user: RequestUser,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.notifications.listForUser(user.id, limit, offset);
  }

  @Patch(':id/read')
  async markRead(@User() user: RequestUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post()
  async create(@User() user: RequestUser, @Body() dto: CreateNotificationDto) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.notifications.createForUser({
      actorUserId: user.id,
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      metadata: dto.metadata,
      sendEmail: dto.sendEmail,
    });
  }
}
