import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User as CurrentUser } from '../../common/decorators/user.decorator';
import { UsersService } from './users.service';
import { MediaService } from '../media/media.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { RequestUser } from '../auth/types/request-user.interface';
import { AuditLogsService } from '../audit/audit.service';
import { SetLegalHoldDto } from './dto/set-legal-hold.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly media: MediaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  @Patch('me/avatar')
  async updateAvatar(@Body() dto: UpdateAvatarDto, @CurrentUser() user: RequestUser) {
    const existing = await this.usersService.findById(user.id);
    if (!existing) {
      throw new Error('User not found');
    }
    const upload = await this.media.uploadBase64Image(dto.file, `users/${user.id}`);
    await this.media.deleteImage(existing.avatarPublicId, existing.avatarUrl);
    const updated = await this.usersService.updateProfile(user.id, {
      avatarUrl: upload.url,
      avatarPublicId: upload.publicId,
    });
    return updated;
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: RequestUser) {
    const existing = await this.usersService.findById(user.id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (existing.legalHold) {
      throw new ForbiddenException('Account deletion is unavailable due to a legal hold.');
    }
    await this.media.deleteImage(existing.avatarPublicId, existing.avatarUrl);
    await this.usersService.deleteById(existing.id);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'delete_account',
      resourceType: 'user',
      resourceId: user.id,
    });
    return { success: true };
  }

  @Get('me/export')
  async exportMe(@CurrentUser() user: RequestUser) {
    const data = await this.usersService.exportUserData(user.id);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'export',
      resourceType: 'user',
      resourceId: user.id,
    });
    return data;
  }

  @Patch(':id/legal-hold')
  async setLegalHold(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetLegalHoldDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const updated = await this.usersService.setLegalHold(id, dto.enabled, dto.reason ?? null);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: dto.enabled ? 'legal_hold_enable' : 'legal_hold_disable',
      resourceType: 'user',
      resourceId: id,
      metadata: dto.reason ? { reason: dto.reason } : undefined,
    });
    return {
      id: updated.id,
      legalHold: updated.legalHold,
      legalHoldReason: updated.legalHoldReason ?? null,
      legalHoldSetAt: updated.legalHoldSetAt ?? null,
    };
  }
}
