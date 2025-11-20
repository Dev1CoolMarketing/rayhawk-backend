import { ConfigService } from '@nestjs/config';
export interface ImageUploadResult {
    url: string;
    publicId: string;
}
export declare class MediaService {
    private readonly config;
    private readonly folder;
    constructor(config: ConfigService);
    uploadBase64Image(data: string, folderSuffix?: string): Promise<ImageUploadResult>;
    deleteImage(publicId?: string | null, fallbackUrl?: string | null): Promise<void>;
    private mapResponse;
    private extractPublicIdFromUrl;
}
