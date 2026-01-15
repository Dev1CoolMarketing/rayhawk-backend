import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiAuthGuard } from '../../common/guards/api-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  getActiveStores(@Query('openNow') openNow?: string) {
    if (openNow === 'true' || openNow === '1') {
      return this.storesService.findActiveOpenNow();
    }
    return this.storesService.findActive();
  }

  @Get('existing')
  getExistingStores() {
    return this.storesService.findExisting();
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  getMyStores(@User() user: RequestUser) {
    return this.storesService.findMine(user.id);
  }

  @Get(':id')
  getStore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.storesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  createStore(@Body() dto: CreateStoreDto, @User() user: RequestUser) {
    return this.storesService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  updateStore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStoreDto,
    @User() user: RequestUser,
  ) {
    return this.storesService.update(id, user.id, dto);
  }

  @Patch(':id/image')
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  updateStoreImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LinkImageDto,
    @User() user: RequestUser,
  ) {
    return this.storesService.updateImage(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  deleteStore(@Param('id', new ParseUUIDPipe()) id: string, @User() user: RequestUser) {
    return this.storesService.remove(id, user.id);
  }
}
