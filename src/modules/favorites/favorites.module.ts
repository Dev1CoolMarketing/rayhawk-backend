import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteStore, Store } from '../../entities';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteStore, Store])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
