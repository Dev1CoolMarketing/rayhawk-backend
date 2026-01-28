import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

const NOTIFICATION_TYPES = ['breach', 'security', 'privacy', 'system'] as const;

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
