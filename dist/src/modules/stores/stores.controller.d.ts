import { RequestUser } from '../auth/types/request-user.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    getActiveStores(): Promise<import("../../entities").Store[]>;
    getExistingStores(): Promise<import("../../entities").Store[]>;
    getMyStores(user: RequestUser): Promise<import("../../entities").Store[]>;
    getStore(id: string): Promise<import("../../entities").Store>;
    createStore(dto: CreateStoreDto, user: RequestUser): Promise<import("../../entities").Store>;
    updateStore(id: string, dto: UpdateStoreDto, user: RequestUser): Promise<import("../../entities").Store>;
    updateStoreImage(id: string, dto: LinkImageDto, user: RequestUser): Promise<import("../../entities").Store>;
    deleteStore(id: string, user: RequestUser): Promise<import("../../entities").Store>;
}
