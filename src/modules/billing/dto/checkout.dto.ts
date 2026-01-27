import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export enum CheckoutMode {
  Subscription = 'subscription',
  Payment = 'payment',
}

export class CheckoutDto {
  @IsEnum(CheckoutMode)
  mode!: CheckoutMode;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  priceId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
