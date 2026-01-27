import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { CustomersService } from './customers.service';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateVitalityPreferencesDto } from './dto/update-vitality-preferences.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get('me')
  async getMe(@User() user: RequestUser) {
    this.ensureCustomer(user);
    const profile = await this.customers.requireProfile(user.id);
    const favorites = await this.customers.listFavoriteStores(user.id);
    return {
      profile: {
        username: profile.username,
        birthYear: profile.birthYear,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        vitalityPreferences: profile.vitalityPreferences ?? {},
      },
      favorites,
    };
  }

  @Post('me/favorites/:storeId')
  addFavorite(@User() user: RequestUser, @Param('storeId', new ParseUUIDPipe()) storeId: string) {
    this.ensureCustomer(user);
    return this.customers.addFavorite(user.id, storeId);
  }

  @Delete('me/favorites/:storeId')
  removeFavorite(@User() user: RequestUser, @Param('storeId', new ParseUUIDPipe()) storeId: string) {
    this.ensureCustomer(user);
    return this.customers.removeFavorite(user.id, storeId);
  }

  @Post('me/profile')
  async createProfile(@User() user: RequestUser, @Body() dto: CreateCustomerProfileDto) {
    const profile = await this.customers.upsertProfile(user.id, dto.birthYear);
    return {
      username: profile.username,
      birthYear: profile.birthYear,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      vitalityPreferences: profile.vitalityPreferences ?? {},
    };
  }

  @Patch('me/vitality-preferences')
  async updateVitalityPreferences(@User() user: RequestUser, @Body() dto: UpdateVitalityPreferencesDto) {
    this.ensureCustomer(user);
    const profile = await this.customers.updateVitalityPreferences(user.id, dto);
    return {
      vitalityPreferences: profile.vitalityPreferences ?? {},
      updatedAt: profile.updatedAt,
    };
  }

  private ensureCustomer(user: RequestUser) {
    if (user.role !== 'customer' && !user.hasCustomerProfile) {
      throw new ForbiddenException('Customer access required');
    }
  }
}
