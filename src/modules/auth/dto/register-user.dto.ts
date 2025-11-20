import { RegisterUserRequest } from '../types/auth.types';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterUserDto implements RegisterUserRequest {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

}
