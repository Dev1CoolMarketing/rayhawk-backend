import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { VendorsService } from './vendors.service';
import { RequestUser } from '../auth/types/request-user.interface';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('onboarding')
  completeOnboarding(@Body() dto: CompleteOnboardingDto, @User() user: RequestUser) {
    return this.vendorsService.completeOnboarding(user.id, dto);
  }
}
