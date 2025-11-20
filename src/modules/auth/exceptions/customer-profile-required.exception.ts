import { UnauthorizedException } from '@nestjs/common';

export class CustomerProfileRequiredException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Customer profile required',
      code: 'CUSTOMER_PROFILE_REQUIRED',
    });
  }
}
