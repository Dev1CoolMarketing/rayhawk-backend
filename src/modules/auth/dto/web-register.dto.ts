import { IsOptional, IsString } from 'class-validator';
import { RegisterCustomerDto } from './register-customer.dto';

export class WebRegisterDto extends RegisterCustomerDto {
  @IsOptional()
  @IsString()
  redirectTo?: string;
}
