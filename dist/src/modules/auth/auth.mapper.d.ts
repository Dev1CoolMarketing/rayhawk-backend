import { CustomerProfile, User, Vendor } from '../../entities';
import { AuthUserDto } from './dto/token-response.dto';
import { UserRole } from './types/auth.types';
export declare const mapUserToAuthUserDto: (user: User, vendor?: Vendor | null, profile?: CustomerProfile | null, roleOverride?: UserRole) => AuthUserDto;
