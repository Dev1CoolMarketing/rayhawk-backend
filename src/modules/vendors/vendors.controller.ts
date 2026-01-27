import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateVendorPlanDto } from './dto/update-vendor-plan.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UploadVendorImageDto } from './dto/upload-vendor-image.dto';
import { VendorsService } from './vendors.service';
import { RequestUser } from '../auth/types/request-user.interface';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('me')
  getProfile(@User() user: RequestUser) {
    return this.vendorsService.getProfile(user.id);
  }

  @Post('me')
  updateProfile(@Body() dto: UpdateVendorProfileDto, @User() user: RequestUser) {
    return this.vendorsService.updateProfile(user.id, dto);
  }

  @Patch('me/image')
  uploadImage(@Body() dto: UploadVendorImageDto, @User() user: RequestUser) {
    return this.vendorsService.uploadImage(user.id, dto);
  }

  @Get('plans')
  listPlans(@User() user: RequestUser) {
    return this.vendorsService.listPlans(user.id);
  }

  @Post('plan')
  updatePlan(@Body() dto: UpdateVendorPlanDto, @User() user: RequestUser) {
    return this.vendorsService.updatePlan(user.id, dto);
  }

  @Post('onboarding')
  completeOnboarding(@Body() dto: CompleteOnboardingDto, @User() user: RequestUser) {
    return this.vendorsService.completeOnboarding(user.id, dto);
  }
}
