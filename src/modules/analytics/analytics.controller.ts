import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AnalyticsGroupBy, AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('Analytics')
@Controller(['analytics', 'collect'])
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  async recordEvent(@Body() dto: CreateAnalyticsEventDto) {
    await this.analyticsService.recordEvent(dto);
  }

  // Ad blockers often block /analytics/*; provide an alternate path that is less likely to be intercepted.
  @Post('events/collect')
  @HttpCode(204)
  async recordEventAlias(@Body() dto: CreateAnalyticsEventDto) {
    await this.analyticsService.recordEvent(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stores/:storeId/summary')
  async storeSummary(
    @Param('storeId') storeId: string,
    @Query() query: AnalyticsQueryDto,
    @User() user: RequestUser,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const group = query.group ?? AnalyticsGroupBy.Day;
    return this.analyticsService.getStoreSummary({ storeId, ownerId: user.id, from, to, group });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stores/:storeId/products')
  async storeProducts(
    @Param('storeId') storeId: string,
    @Query() query: AnalyticsQueryDto,
    @User() user: RequestUser,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    return this.analyticsService.getProductBreakdown({ storeId, ownerId: user.id, from, to });
  }
}
