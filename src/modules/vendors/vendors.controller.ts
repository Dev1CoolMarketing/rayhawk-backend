import { Body, Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';
import { RequestUser } from '../auth/types/request-user.interface';
import { UploadImageDto } from '../../common/dto/upload-image.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('plans')
  listPlans(@User() user: RequestUser) {
    return this.vendorsService.getPlanOptions(user.id);
  }

  @Post('onboarding')
  completeOnboarding(@Body() dto: CompleteOnboardingDto, @User() user: RequestUser) {
    return this.vendorsService.completeOnboarding(user.id, dto);
  }

  @Post('plan')
  updatePlan(@Body() dto: UpdatePlanDto, @User() user: RequestUser) {
    return this.vendorsService.updatePlan(user.id, dto.planKey);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyVendor(@User() user: RequestUser) {
    return this.vendorsService.getVendorProfile(user.id);
  }

  @Post('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateVendor(@Body() dto: UpdateVendorDto, @User() user: RequestUser) {
    return this.vendorsService.updateVendorProfile(user.id, dto);
  }

  @Patch('me/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  uploadVendorImage(@Body() dto: UploadImageDto, @User() user: RequestUser) {
    return this.vendorsService.uploadVendorImage(user.id, dto);
  }
}
