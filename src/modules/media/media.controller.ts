import { Body, Controller, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';

type SignUploadRequest = {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw';
  maxBytes?: number;
  allowedFormats?: string[];
};

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class MediaController {
  constructor(private readonly config: ConfigService) {}

  @Post('sign')
  signUpload(@Body() body: SignUploadRequest, @User() user: RequestUser) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    const baseFolder = this.config.get<string>('CLOUDINARY_MEDIA_FOLDER') ?? 'tshots';
    if (!cloudName || !apiKey || !apiSecret) {
      throw new UnauthorizedException('Cloudinary is not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = body.folder ?? `${baseFolder}/users/${user.id}`;

    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      resourceType: body.resourceType ?? 'image',
      allowedFormats: body.allowedFormats ?? ['jpg', 'jpeg', 'png', 'webp'],
      maxBytes: body.maxBytes ?? 5 * 1024 * 1024,
    };
  }
}
