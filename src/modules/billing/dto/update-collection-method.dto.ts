import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateCollectionMethodDto {
  @IsEnum(['charge_automatically', 'send_invoice'])
  collectionMethod!: 'charge_automatically' | 'send_invoice';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  daysUntilDue?: number;
}
