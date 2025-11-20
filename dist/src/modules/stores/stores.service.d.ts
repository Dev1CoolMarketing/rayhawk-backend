import { Repository } from 'typeorm';
import { Product, Store, Vendor } from '../../entities';
import { CreateStoreDto } from './dto/create-store.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresService {
    private readonly storesRepository;
    private readonly productsRepository;
    private readonly vendorsRepository;
    private readonly media;
    constructor(storesRepository: Repository<Store>, productsRepository: Repository<Product>, vendorsRepository: Repository<Vendor>, media: MediaService);
    findActive(): Promise<Store[]>;
    findExisting(): Promise<Store[]>;
    findMine(ownerId: string): Promise<Store[]>;
    findOne(id: string): Promise<Store>;
    create(dto: CreateStoreDto, ownerId: string): Promise<Store>;
    update(id: string, ownerId: string, dto: UpdateStoreDto): Promise<Store>;
    updateImage(storeId: string, ownerId: string, image: LinkImageDto): Promise<Store>;
    remove(id: string, ownerId: string): Promise<Store>;
    private requireOwnedStore;
    private requireVendor;
    private handleSlugCollision;
}
