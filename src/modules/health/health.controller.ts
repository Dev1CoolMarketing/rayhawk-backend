import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { version } from '../../../package.json';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      uptime: process.uptime(),
      version,
      timestamp: new Date().toISOString(),
    };
  }
}
