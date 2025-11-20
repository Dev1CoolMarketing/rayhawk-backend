import { LoginRequest } from '../types/auth.types';
import { RegisterUserDto } from './register-user.dto';
import { IsIn, IsOptional } from 'class-validator';

export class LoginUserDto extends RegisterUserDto implements LoginRequest {
  @IsOptional()
  @IsIn(['vendor', 'customer'])
  audience?: 'vendor' | 'customer';
}
