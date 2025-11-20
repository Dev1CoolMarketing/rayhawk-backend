import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
