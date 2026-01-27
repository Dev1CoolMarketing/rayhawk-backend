import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { SignUploadDto } from './dto/sign-upload.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly media: MediaService) {}

  @Post('sign')
  signUpload(@Body() dto: SignUploadDto) {
    return this.media.createUploadSignature(dto);
  }
}
