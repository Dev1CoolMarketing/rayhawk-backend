import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product, Store } from '../../entities';
import { CreateProductDto } from './dto/create-product.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    @InjectRepository(Store) private readonly storesRepository: Repository<Store>,
    private readonly media: MediaService,
  ) {}

  findByStore(storeId: string) {
    return this.productsRepository.find({
      where: { storeId, status: 'active', deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(storeId: string, productId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId, storeId, deletedAt: IsNull() },
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
    const product = this.productsRepository.create({
      ...dto,
      status: dto.status ?? 'active',
      linkUrl: dto.linkUrl ?? null,
      billingType: dto.billingType ?? 'one_time',
      billingInterval: dto.billingInterval ?? null,
      billingQuantity: dto.billingQuantity ?? null,
      unitCount: dto.unitCount ?? null,
      unitCountType: dto.unitCountType ?? null,
      formFactor: dto.formFactor ?? null,
      bulletPoints: dto.bulletPoints ?? null,
      featured: dto.featured ?? false,
      categories: dto.categories ? dto.categories.map((key) => ({ key, label: key })) : null,
      storeId,
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
      product.status = dto.status;
    }
    if (dto.linkUrl !== undefined) {
      product.linkUrl = dto.linkUrl ?? null;
    }
    if (dto.bulletPoints !== undefined) {
      product.bulletPoints = dto.bulletPoints ?? null;
    }
    if (dto.featured !== undefined) {
      product.featured = dto.featured;
    }
    if (dto.unitCount !== undefined) {
      product.unitCount = dto.unitCount ?? null;
    }
    if (dto.unitCountType !== undefined) {
      product.unitCountType = dto.unitCountType ?? null;
    }
    if (dto.formFactor !== undefined) {
      product.formFactor = dto.formFactor ?? null;
    }
    if (dto.billingType !== undefined) {
      product.billingType = dto.billingType ?? null;
    }
    if (dto.billingInterval !== undefined) {
      product.billingInterval = dto.billingInterval ?? null;
    }
    if (dto.billingQuantity !== undefined) {
      product.billingQuantity = dto.billingQuantity ?? null;
    }
    if (dto.categories !== undefined) {
      product.categories = dto.categories ? dto.categories.map((key) => ({ key, label: key })) : null;
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
}
