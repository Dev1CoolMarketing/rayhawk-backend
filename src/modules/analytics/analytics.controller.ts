import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { createHash } from 'crypto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AnalyticsGroupBy, AnalyticsQueryDto } from './dto/analytics-query.dto';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 120;
const rateLimiter = new Map<string, { start: number; count: number }>();

function hashIp(ip?: string | string[] | null): string | null {
  if (!ip) return null;
  const resolved = Array.isArray(ip) ? ip[0] : ip;
  return createHash('sha256').update(resolved).digest('hex');
}

function rateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimiter.get(key);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(key, { start: now, count: 1 });
    return;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_EVENTS) {
    throw new HttpException('Too many analytics events. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@ApiTags('Analytics')
@Controller(['analytics', 'collect'])
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  async recordEvent(@Body() dto: CreateAnalyticsEventDto, @Req() req: Request) {
    const ipHash = hashIp(req.headers['x-forwarded-for'] ?? req.ip ?? null);
    const throttleKey = ipHash ?? dto.sessionId ?? 'anonymous';
    rateLimit(throttleKey);
    await this.analyticsService.recordEvent(dto, ipHash);
  }

  // Ad blockers often block /analytics/*; provide an alternate path that is less likely to be intercepted.
  @Post('events/collect')
  @HttpCode(204)
  async recordEventAlias(@Body() dto: CreateAnalyticsEventDto, @Req() req: Request) {
    const ipHash = hashIp(req.headers['x-forwarded-for'] ?? req.ip ?? null);
    const throttleKey = ipHash ?? dto.sessionId ?? 'anonymous';
    rateLimit(throttleKey);
    await this.analyticsService.recordEvent(dto, ipHash);
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
