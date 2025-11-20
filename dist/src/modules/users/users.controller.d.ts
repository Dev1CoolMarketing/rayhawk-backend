import { UsersService } from './users.service';
import { MediaService } from '../media/media.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { RequestUser } from '../auth/types/request-user.interface';
export declare class UsersController {
    private readonly usersService;
    private readonly media;
    constructor(usersService: UsersService, media: MediaService);
    updateAvatar(dto: UpdateAvatarDto, user: RequestUser): Promise<import("../../entities").User>;
    deleteAccount(user: RequestUser): Promise<{
        success: boolean;
    }>;
}
