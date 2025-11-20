import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('me')
  getMyFavorites(@User() user: RequestUser) {
    return this.favoritesService.getMine(user.id);
  }

  @Post(':storeId')
  addFavorite(@User() user: RequestUser, @Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return this.favoritesService.add(user.id, storeId);
  }

  @Delete(':storeId')
  removeFavorite(@User() user: RequestUser, @Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return this.favoritesService.remove(user.id, storeId);
  }
}
