import { Body, Controller, Delete, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User as CurrentUser } from '../../common/decorators/user.decorator';
import { UsersService } from './users.service';
import { MediaService } from '../media/media.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { RequestUser } from '../auth/types/request-user.interface';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly media: MediaService) {}

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
    await this.media.deleteImage(existing.avatarPublicId, existing.avatarUrl);
    await this.usersService.deleteById(existing.id);
    return { success: true };
  }
}
