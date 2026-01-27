import { LoginRequest } from '../types/auth.types';
import { RegisterUserDto } from './register-user.dto';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class LoginUserDto extends RegisterUserDto implements LoginRequest {
  @IsOptional()
  @IsIn(['vendor', 'customer'])
  audience?: 'vendor' | 'customer';

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(3000)
  birthYear?: number;
}
