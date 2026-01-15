import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiAuthGuard } from '../../common/guards/api-auth.guard';
import { ProductsService } from './products.service';

@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(ApiAuthGuard)
  list() {
    return this.productsService.listCategories();
  }
}
