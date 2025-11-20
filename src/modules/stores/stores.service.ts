import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Product, Store, Vendor } from '../../entities';
import { CreateStoreDto } from './dto/create-store.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private readonly storesRepository: Repository<Store>,
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    @InjectRepository(Vendor) private readonly vendorsRepository: Repository<Vendor>,
    private readonly media: MediaService,
  ) {}

  findActive() {
    return this.storesRepository.find({ where: { status: 'active', deletedAt: IsNull() } });
  }

  findExisting() {
    return this.storesRepository.find({ where: { deletedAt: IsNull() } });
  }

  async findMine(ownerId: string) {
    const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
    if (!vendor) {
      return [];
    }
    return this.storesRepository.find({ where: { vendorId: vendor.id, deletedAt: IsNull() } });
  }

  async findOne(id: string) {
    const store = await this.storesRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async create(dto: CreateStoreDto, ownerId: string) {
    const vendor = await this.requireVendor(ownerId);
    const store = this.storesRepository.create({
      ...dto,
      vendorId: vendor.id,
      openingHours: dto.openingHours ?? null,
      description: dto.description ?? null,
    });
    try {
      return await this.storesRepository.save(store);
    } catch (error) {
      this.handleSlugCollision(error);
    }
  }

  async update(id: string, ownerId: string, dto: UpdateStoreDto) {
    const store = await this.requireOwnedStore(id, ownerId);
    if (dto.name !== undefined) {
      store.name = dto.name;
    }
    if (dto.slug !== undefined) {
      store.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      store.description = dto.description.trim().length ? dto.description : null;
    }
    if (dto.addressLine1 !== undefined) {
      store.addressLine1 = dto.addressLine1;
    }
    if (dto.addressLine2 !== undefined) {
      store.addressLine2 = dto.addressLine2.trim().length ? dto.addressLine2 : null;
    }
    if (dto.city !== undefined) {
      store.city = dto.city;
    }
    if (dto.state !== undefined) {
      store.state = dto.state;
    }
    if (dto.postalCode !== undefined) {
      store.postalCode = dto.postalCode;
    }
    if (dto.status !== undefined) {
      store.status = dto.status;
    }
    if (dto.openingHours !== undefined) {
      const normalized = dto.openingHours.map((line) => line.trim()).filter((line) => line.length > 0);
      store.openingHours = normalized.length ? normalized : null;
    }
    try {
      return await this.storesRepository.save(store);
    } catch (error) {
      this.handleSlugCollision(error);
    }
  }

  async updateImage(storeId: string, ownerId: string, image: LinkImageDto) {
    const store = await this.requireOwnedStore(storeId, ownerId);
    await this.media.deleteImage(store.imagePublicId, store.imageUrl);
    store.imageUrl = image.url;
    store.imagePublicId = image.publicId;
    return this.storesRepository.save(store);
  }

  async remove(id: string, ownerId: string) {
    const store = await this.requireOwnedStore(id, ownerId);
    const products = await this.productsRepository.find({ where: { storeId: store.id } });
    await Promise.all(
      products.map(async (product) => {
        await this.media.deleteImage(product.imagePublicId, product.imageUrl);
      }),
    );
    if (products.length) {
      await this.productsRepository.softRemove(products);
    }
    await this.media.deleteImage(store.imagePublicId, store.imageUrl);
    return this.storesRepository.softRemove(store);
  }

  private async requireOwnedStore(id: string, ownerId: string) {
    const store = await this.storesRepository.findOne({ where: { id }, relations: ['vendor'] });
    if (!store || store.deletedAt) {
      throw new NotFoundException('Store not found');
    }
    if (!store.vendor || store.vendor.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to manage this store');
    }
    return store;
  }

  private async requireVendor(ownerId: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
    if (!vendor) {
      throw new ForbiddenException('Vendor onboarding required before managing stores');
    }
    if (vendor.status !== 'active') {
      throw new ForbiddenException('Vendor account is not active');
    }
    return vendor;
  }

  private handleSlugCollision(error: unknown): never {
    const isQueryError = error instanceof QueryFailedError;
    if (
      isQueryError &&
      (error.driverError?.code === '23505' || error.driverError?.routine === '_bt_check_unique') &&
      error.driverError?.constraint === 'IDX_790b2968701a6ff5ff38323776'
    ) {
      throw new ConflictException('Store slug already in use. Try a different slug.');
    }
    throw error;
  }
}
