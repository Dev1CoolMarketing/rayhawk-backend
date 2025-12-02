import { Controller, Get, Post, Body, UseGuards, Query, DefaultValuePipe, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { HormoneLogsService } from './hormone-logs.service';
import { CreateHormoneLogDto } from './dto/create-hormone-log.dto';

@ApiTags('HormoneLogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hormone-logs')
export class HormoneLogsController {
  constructor(private readonly hormoneLogsService: HormoneLogsService) {}

  @Post()
  create(@Body() dto: CreateHormoneLogDto, @User() user: RequestUser) {
    return this.hormoneLogsService.create(user.id, user.role, dto);
  }

  @Get('latest')
  latest(@User() user: RequestUser) {
    return this.hormoneLogsService.latestForUser(user.id);
  }

  @Get('me')
  list(
    @User() user: RequestUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.hormoneLogsService.listForUser(user.id, limit, offset);
  }

  @Get('admin/summary')
  summary(@User() user: RequestUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.hormoneLogsService.summary();
  }
}
