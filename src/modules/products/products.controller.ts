import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return this.productsService.findByStore(storeId);
  }

  @Get(':productId')
  getProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.productsService.findOne(storeId, productId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() dto: CreateProductDto,
    @User() user: RequestUser,
  ) {
    return this.productsService.create(storeId, dto, user.id);
  }

  @Patch(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: UpdateProductDto,
    @User() user: RequestUser,
  ) {
    return this.productsService.update(storeId, productId, user.id, dto);
  }

  @Patch(':productId/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProductImage(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: LinkImageDto,
    @User() user: RequestUser,
  ) {
    return this.productsService.updateImage(storeId, productId, user.id, dto);
  }

  @Delete(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @User() user: RequestUser,
  ) {
    return this.productsService.remove(storeId, productId, user.id);
  }
}
