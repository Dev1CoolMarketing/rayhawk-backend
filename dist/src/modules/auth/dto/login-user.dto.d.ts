import { LoginRequest } from '../types/auth.types';
import { RegisterUserDto } from './register-user.dto';
export declare class LoginUserDto extends RegisterUserDto implements LoginRequest {
    audience?: 'vendor' | 'customer';
}
