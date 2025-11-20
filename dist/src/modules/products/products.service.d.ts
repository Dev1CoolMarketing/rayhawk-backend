import { Repository } from 'typeorm';
import { Product, Store } from '../../entities';
import { CreateProductDto } from './dto/create-product.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private readonly productsRepository;
    private readonly storesRepository;
    private readonly media;
    constructor(productsRepository: Repository<Product>, storesRepository: Repository<Store>, media: MediaService);
    findByStore(storeId: string): Promise<Product[]>;
    findOne(storeId: string, productId: string): Promise<Product>;
    create(storeId: string, dto: CreateProductDto, requesterId: string): Promise<Product>;
    updateImage(storeId: string, productId: string, ownerId: string, image: LinkImageDto): Promise<Product>;
    update(storeId: string, productId: string, ownerId: string, dto: UpdateProductDto): Promise<Product>;
    remove(storeId: string, productId: string, ownerId: string): Promise<Product>;
}
