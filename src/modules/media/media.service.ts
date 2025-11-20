import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface ImageUploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class MediaService {
  private readonly folder: string;

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
    this.folder = this.config.get<string>('CLOUDINARY_MEDIA_FOLDER') ?? 'tshots';
  }

  async uploadBase64Image(data: string, folderSuffix?: string): Promise<ImageUploadResult> {
    try {
      const folder = folderSuffix ? `${this.folder}/${folderSuffix}` : this.folder;
      const response = await cloudinary.uploader.upload(data, {
        folder,
        overwrite: true,
      });
      return this.mapResponse(response);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload image: ${(error as Error).message}`);
    }
  }

  async deleteImage(publicId?: string | null, fallbackUrl?: string | null) {
    const target = publicId ?? this.extractPublicIdFromUrl(fallbackUrl);
    if (!target) return;
    try {
      await cloudinary.uploader.destroy(target);
    } catch (error) {
      // non-blocking cleanup
    }
  }

  private mapResponse(result: UploadApiResponse): ImageUploadResult {
    return {
      url: result.secure_url ?? result.url,
      publicId: result.public_id,
    };
  }

  private extractPublicIdFromUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const uploadIndex = segments.findIndex((segment) => segment === 'upload');
      if (uploadIndex === -1) {
        return undefined;
      }
      const remainder = segments.slice(uploadIndex + 1);
      if (remainder.length === 0) {
        return undefined;
      }
      if (/^v\d+$/i.test(remainder[0])) {
        remainder.shift();
      }
      if (remainder.length === 0) {
        return undefined;
      }
      const lastIndex = remainder.length - 1;
      remainder[lastIndex] = remainder[lastIndex].replace(/\.[^.]+$/, '');
      const publicId = remainder.join('/');
      return publicId || undefined;
    } catch {
      return undefined;
    }
  }
}
