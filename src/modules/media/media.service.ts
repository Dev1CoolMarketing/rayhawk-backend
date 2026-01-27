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
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      // Throwing here would boot the app; instead, configure lazily and throw on upload.
      this.folder = 'tshots';
      return;
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.folder = this.config.get<string>('CLOUDINARY_MEDIA_FOLDER') ?? 'tshots';
  }

  async uploadBase64Image(data: string, folderSuffix?: string): Promise<ImageUploadResult> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Image upload is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    try {
      const folder = folderSuffix ? `${this.folder}/${folderSuffix}` : this.folder;
      const response = await cloudinary.uploader.upload(data, {
        folder,
        overwrite: true,
      });
      return this.mapResponse(response);
    } catch (error) {
      const message =
        (error as any)?.message ??
        (error as any)?.error?.message ??
        (typeof error === 'string' ? error : 'Unexpected error');
      const hint = message?.toLowerCase().includes('file size')
        ? ' (file may be too large; limit ~10MB)'
        : '';
      throw new InternalServerErrorException(`Failed to upload image: ${message}${hint}`);
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
