import { RequestUser } from '../auth/types/request-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getProducts(storeId: string): Promise<import("../../entities").Product[]>;
    getProduct(storeId: string, productId: string): Promise<import("../../entities").Product>;
    createProduct(storeId: string, dto: CreateProductDto, user: RequestUser): Promise<import("../../entities").Product>;
    updateProduct(storeId: string, productId: string, dto: UpdateProductDto, user: RequestUser): Promise<import("../../entities").Product>;
    updateProductImage(storeId: string, productId: string, dto: LinkImageDto, user: RequestUser): Promise<import("../../entities").Product>;
    deleteProduct(storeId: string, productId: string, user: RequestUser): Promise<import("../../entities").Product>;
}
