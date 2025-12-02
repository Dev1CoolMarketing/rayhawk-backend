import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Product, ProductCategory, Store } from '../../entities';
import { CreateProductDto } from './dto/create-product.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory) private readonly categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(Store) private readonly storesRepository: Repository<Store>,
    private readonly media: MediaService,
    private readonly billingService: BillingService,
  ) {}

  findByStore(storeId: string) {
    return this.productsRepository.find({
      where: { storeId, status: 'active', deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['categories'],
    });
  }

  listCategories() {
    return this.categoriesRepository.find({
      where: { deletedAt: IsNull() },
      order: { label: 'ASC' },
    });
  }

  async findOne(storeId: string, productId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, storeId, deletedAt: IsNull() },
      relations: ['categories'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(storeId: string, dto: CreateProductDto, requesterId: string) {
    const store = await this.storesRepository.findOne({
      where: { id: storeId, deletedAt: IsNull() },
      relations: ['vendor'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    if (!store.vendor || store.vendor.ownerId !== requesterId) {
      throw new ForbiddenException('You do not have permission to manage this store');
    }

    const entitlements = await this.billingService.getVendorEntitlements(store.vendorId);
    if (!entitlements || !entitlements.isActive) {
      throw new ForbiddenException('Billing subscription is not active');
    }
    if (entitlements.productsPerStoreAllowed !== null && entitlements.productsPerStoreAllowed >= 0) {
      const productCount = await this.productsRepository.count({
        where: { storeId, status: 'active', deletedAt: IsNull() },
      });
      if (productCount >= entitlements.productsPerStoreAllowed) {
        throw new ForbiddenException('Product limit reached for current plan');
      }
    }

    const categories = dto.categories?.length ? await this.resolveCategories(dto.categories) : [];

    const product = this.productsRepository.create({
      ...dto,
      status: dto.status ?? 'active',
      linkUrl: dto.linkUrl ?? null,
      storeId,
      categories,
    });
    return this.productsRepository.save(product);
  }

  async updateImage(storeId: string, productId: string, ownerId: string, image: LinkImageDto) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, storeId },
      relations: ['store', 'store.vendor'],
    });
    if (!product || product.deletedAt || product.store?.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }
    await this.media.deleteImage(product.imagePublicId, product.imageUrl);
    product.imageUrl = image.url;
    product.imagePublicId = image.publicId;
    return this.productsRepository.save(product);
  }

  async update(storeId: string, productId: string, ownerId: string, dto: UpdateProductDto) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, storeId },
      relations: ['store', 'store.vendor'],
    });
    if (!product || product.deletedAt || product.store?.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }
    const entitlements = await this.billingService.getVendorEntitlements(product.store.vendorId);
    if (dto.name !== undefined) {
      product.name = dto.name;
    }
    if (dto.description !== undefined) {
      product.description = dto.description ?? null;
    }
    if (dto.priceCents !== undefined) {
      product.priceCents = dto.priceCents;
    }
    if (dto.status !== undefined) {
      if (dto.status === 'active' && (!entitlements || !entitlements.isActive)) {
        throw new ForbiddenException('Billing subscription is not active');
      }
      if (
        dto.status === 'active' &&
        product.status !== 'active' &&
        entitlements &&
        entitlements.productsPerStoreAllowed !== null &&
        entitlements.productsPerStoreAllowed !== undefined &&
        entitlements.productsPerStoreAllowed >= 0
      ) {
        const activeCount = await this.productsRepository.count({
          where: { storeId, status: 'active', deletedAt: IsNull() },
        });
        if (activeCount >= entitlements.productsPerStoreAllowed) {
          throw new ForbiddenException('Product limit reached for current plan');
        }
      }
      product.status = dto.status;
    }
    if (dto.linkUrl !== undefined) {
      product.linkUrl = dto.linkUrl ?? null;
    }
    if (dto.categories !== undefined) {
      product.categories = dto.categories?.length ? await this.resolveCategories(dto.categories) : [];
    }
    return this.productsRepository.save(product);
  }

  async remove(storeId: string, productId: string, ownerId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, storeId },
      relations: ['store', 'store.vendor'],
    });
    if (!product || product.deletedAt || product.store?.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }
    await this.media.deleteImage(product.imagePublicId, product.imageUrl);
    return this.productsRepository.softRemove(product);
  }

  private async resolveCategories(keys: string[]): Promise<ProductCategory[]> {
    if (!keys.length) return [];
    const categories = await this.categoriesRepository.find({
      where: { key: In(keys), deletedAt: IsNull() },
    });
    if (categories.length !== keys.length) {
      throw new NotFoundException('One or more categories were not found or are inactive');
    }
    return categories;
  }
}
