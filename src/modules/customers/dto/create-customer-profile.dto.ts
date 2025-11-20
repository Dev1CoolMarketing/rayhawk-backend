import { IsInt, Max, Min } from 'class-validator';

export class CreateCustomerProfileDto {
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
