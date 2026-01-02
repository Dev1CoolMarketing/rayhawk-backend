import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Product, Store, Vendor } from '../../entities';
import { CreateStoreDto } from './dto/create-store.dto';
import { MediaService } from '../media/media.service';
import { LinkImageDto } from '../../common/dto/link-image.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { BillingService } from '../billing/billing.service';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TIMEZONE = 'America/Los_Angeles';
const US_TIMEZONES = new Set([
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
]);
const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type WeekdayKey = (typeof WEEK_DAYS)[number];
type WeeklyHoursRange = { start: number; end: number };
type OpeningHoursWeekly = Record<WeekdayKey, WeeklyHoursRange[]>;

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];
const dayKeyToWeekly: Record<DayKey, WeekdayKey> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

const dayMap: Record<string, DayKey> = {
  mon: 'Mon',
  monday: 'Mon',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  wed: 'Wed',
  weds: 'Wed',
  wednesday: 'Wed',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  thursday: 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  sun: 'Sun',
  sunday: 'Sun',
};

const normalizeDayToken = (value: string) => {
  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  return dayMap[key];
};

const expandDayRange = (start: DayKey, end: DayKey) => {
  const startIndex = DAY_KEYS.indexOf(start);
  const endIndex = DAY_KEYS.indexOf(end);
  if (startIndex === -1 || endIndex === -1) return [];
  if (startIndex <= endIndex) {
    return DAY_KEYS.slice(startIndex, endIndex + 1);
  }
  return [...DAY_KEYS.slice(startIndex), ...DAY_KEYS.slice(0, endIndex + 1)];
};

const parseDayPart = (input: string): DayKey[] => {
  const cleaned = input
    .replace(/\./g, '')
    .replace(/\band\b/gi, ',')
    .replace(/&/g, ',')
    .trim();
  if (!cleaned) return [];
  const lower = cleaned.toLowerCase();
  if (lower === 'daily' || lower === 'everyday' || lower === 'all days') {
    return [...DAY_KEYS];
  }
  const parts = cleaned.split(/\s*,\s*/).filter(Boolean);
  const days: DayKey[] = [];
  parts.forEach((part) => {
    const rangeTokens = part.split(/\s*(?:-|–|—|to)\s*/i).filter(Boolean);
    if (rangeTokens.length === 2) {
      const start = normalizeDayToken(rangeTokens[0]);
      const end = normalizeDayToken(rangeTokens[1]);
      if (start && end) {
        expandDayRange(start, end).forEach((day) => {
          if (!days.includes(day)) {
            days.push(day);
          }
        });
        return;
      }
    }
    const single = normalizeDayToken(part);
    if (single && !days.includes(single)) {
      days.push(single);
    }
  });
  return days;
};

const parseTimeTo24 = (value: string) => {
  const cleaned = value.trim().toLowerCase().replace(/\./g, '');
  const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    const hour = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2] ?? '0');
    if (hour < 1 || hour > 12 || minutes < 0 || minutes > 59) return null;
    const isPm = ampmMatch[3] === 'pm';
    const normalizedHour = (hour % 12) + (isPm ? 12 : 0);
    return `${normalizedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  const twentyFourMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (twentyFourMatch) {
    const hour = Number(twentyFourMatch[1]);
    const minutes = Number(twentyFourMatch[2] ?? '0');
    if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) return null;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return null;
};

type ParsedRange = { start: string; end: string };
const parseTimeRanges = (input: string): ParsedRange[] => {
  const segments = input.split(/\s*(?:;|,|\/)\s*/).filter(Boolean);
  const ranges: ParsedRange[] = [];
  segments.forEach((segment) => {
    const match = segment.match(/(.+?)(?:\s*(?:-|–|—|to)\s*)(.+)/i);
    if (!match) return;
    const start = parseTimeTo24(match[1]);
    const end = parseTimeTo24(match[2]);
    if (start && end) {
      ranges.push({ start, end });
    }
  });
  return ranges;
};

const toMinutes = (value: string) => {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minutes = Number(minutePart ?? '0');
  if (!Number.isFinite(hour) || !Number.isFinite(minutes)) return null;
  if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) return null;
  return hour * 60 + minutes;
};

const weekdayShortToKey: Record<string, WeekdayKey> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store) private readonly storesRepository: Repository<Store>,
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    @InjectRepository(Vendor) private readonly vendorsRepository: Repository<Vendor>,
    private readonly media: MediaService,
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  findActive() {
    return this.storesRepository.find({ where: { status: 'active', deletedAt: IsNull() } });
  }

  async findActiveOpenNow() {
    const stores = await this.findActive();
    return stores.filter((store) => this.isStoreOpenNow(store));
  }

  findExisting() {
    return this.storesRepository.find({ where: { deletedAt: IsNull() } });
  }

  async findMine(ownerId: string) {
    const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
    if (!vendor) {
      return [];
    }
    const stores = await this.storesRepository.find({
      where: { vendorId: vendor.id, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    const entitlements = await this.billingService.getVendorEntitlements(vendor.id);
    if (entitlements && entitlements.storesAllowed !== null) {
      if (!entitlements.isActive && entitlements.storesAllowed === 0) {
        return [];
      }
      if (entitlements.storesAllowed >= 0 && stores.length > entitlements.storesAllowed) {
        return stores.slice(0, entitlements.storesAllowed);
      }
    }

    return stores;
  }

  async findOne(id: string) {
    const store = await this.storesRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async create(dto: CreateStoreDto, ownerId: string) {
    const vendor = await this.requireVendor(ownerId);

    const entitlements = await this.billingService.getVendorEntitlements(vendor.id);
    if (entitlements) {
      if (!entitlements.isActive) {
        throw new ForbiddenException('Billing subscription is not active');
      }
      if (entitlements.storesAllowed !== null) {
        const storeCount = await this.storesRepository.count({
          where: { vendorId: vendor.id, deletedAt: IsNull(), status: 'active' },
        });
        if (storeCount >= entitlements.storesAllowed) {
          throw new ForbiddenException('Store limit reached for current plan');
        }
      }
    }

    const store = this.storesRepository.create({
      ...dto,
      vendorId: vendor.id,
      openingHours: dto.openingHours ?? null,
      openingHoursWeekly: this.normalizeWeeklyHours(dto.openingHoursWeekly),
      timezone: this.normalizeTimezone(dto.timezone),
      description: dto.description ?? null,
      phoneNumber: dto.phoneNumber?.trim() ? dto.phoneNumber.trim() : null,
    });

    if (!store.latitude || !store.longitude) {
      const coords = await this.geocodeAddress(store);
      store.latitude = coords?.latitude ?? null;
      store.longitude = coords?.longitude ?? null;
    }
    try {
      return await this.storesRepository.save(store);
    } catch (error) {
      this.handleSlugCollision(error);
    }
  }

  async update(id: string, ownerId: string, dto: UpdateStoreDto) {
    const store = await this.requireOwnedStore(id, ownerId);
    if (dto.name !== undefined) {
      store.name = dto.name;
    }
    if (dto.slug !== undefined) {
      store.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      store.description = dto.description.trim().length ? dto.description : null;
    }
    let addressChanged = false;
    if (dto.addressLine1 !== undefined) {
      store.addressLine1 = dto.addressLine1;
      addressChanged = true;
    }
    if (dto.addressLine2 !== undefined) {
      store.addressLine2 = dto.addressLine2.trim().length ? dto.addressLine2 : null;
      addressChanged = true;
    }
    if (dto.city !== undefined) {
      store.city = dto.city;
      addressChanged = true;
    }
    if (dto.state !== undefined) {
      store.state = dto.state;
      addressChanged = true;
    }
    if (dto.postalCode !== undefined) {
      store.postalCode = dto.postalCode;
      addressChanged = true;
    }
    if (dto.status !== undefined) {
      // Only allow activation if under limit and plan active
      if (dto.status === 'active') {
        const entitlements = await this.billingService.getVendorEntitlements(store.vendorId);
        if (!entitlements || !entitlements.isActive) {
          throw new ForbiddenException('Cannot activate store: plan inactive or store limit reached');
        }
        if (entitlements.storesAllowed !== null && entitlements.storesAllowed >= 0) {
          const activeCount = await this.storesRepository.count({
            where: { vendorId: store.vendorId, deletedAt: IsNull(), status: 'active' },
          });
          if ((entitlements.storesAllowed ?? 0) <= activeCount) {
            throw new ForbiddenException('Cannot activate store: plan inactive or store limit reached');
          }
        }
      }
      store.status = dto.status;
    }
    if (dto.openingHours !== undefined) {
      const normalized = dto.openingHours.map((line) => line.trim()).filter((line) => line.length > 0);
      store.openingHours = normalized.length ? normalized : null;
    }
    if (dto.openingHoursWeekly !== undefined) {
      store.openingHoursWeekly = this.normalizeWeeklyHours(dto.openingHoursWeekly);
    }
    if (dto.timezone !== undefined) {
      store.timezone = this.normalizeTimezone(dto.timezone);
    }
    if (dto.phoneNumber !== undefined) {
      store.phoneNumber = dto.phoneNumber.trim().length ? dto.phoneNumber.trim() : null;
    }
    if (addressChanged) {
      const coords = await this.geocodeAddress(store);
      store.latitude = coords?.latitude ?? null;
      store.longitude = coords?.longitude ?? null;
    }
    try {
      return await this.storesRepository.save(store);
    } catch (error) {
      this.handleSlugCollision(error);
    }
  }

  async updateImage(storeId: string, ownerId: string, image: LinkImageDto) {
    const store = await this.requireOwnedStore(storeId, ownerId);
    await this.media.deleteImage(store.imagePublicId, store.imageUrl);
    store.imageUrl = image.url;
    store.imagePublicId = image.publicId;
    return this.storesRepository.save(store);
  }

  private normalizeTimezone(value?: string | null) {
    if (value && US_TIMEZONES.has(value)) {
      return value;
    }
    return this.config.get<string>('DEFAULT_STORE_TIMEZONE') ?? DEFAULT_TIMEZONE;
  }

  private normalizeWeeklyHours(value?: Record<string, unknown> | null): OpeningHoursWeekly | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const weekly = WEEK_DAYS.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {} as OpeningHoursWeekly);
    let hasAny = false;
    WEEK_DAYS.forEach((day) => {
      const rawRanges = Array.isArray((value as Record<string, unknown>)[day])
        ? ((value as Record<string, unknown>)[day] as Array<Record<string, unknown>>)
        : [];
      const cleaned = rawRanges.reduce<WeeklyHoursRange[]>((ranges, range) => {
        const startValue = Number(range?.start);
        const endValue = Number(range?.end);
        if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
          return ranges;
        }
        const start = Math.floor(startValue);
        const end = Math.floor(endValue);
        if (start < 0 || start > 1439 || end < 0 || end > 1440 || start === end) {
          return ranges;
        }
        ranges.push({ start, end });
        return ranges;
      }, []);
      if (cleaned.length) {
        weekly[day] = cleaned;
        hasAny = true;
      }
    });
    return hasAny ? weekly : null;
  }

  private isStoreOpenNow(store: Store, now = new Date()) {
    const weekly = store.openingHoursWeekly ?? this.deriveWeeklyFromOpeningHours(store.openingHours);
    if (!weekly) {
      return false;
    }
    const timezone = store.timezone || this.normalizeTimezone(null);
    let parts: Intl.DateTimeFormatPart[] | null = null;
    try {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);
    } catch {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: DEFAULT_TIMEZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);
    }

    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    const dayKey = weekdayShortToKey[weekday];
    if (!dayKey || !Number.isFinite(hour) || !Number.isFinite(minute)) {
      return false;
    }
    const minutes = hour * 60 + minute;
    const ranges = weekly[dayKey] ?? [];
    return ranges.some((range) => {
      if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) {
        return false;
      }
      if (range.start < range.end) {
        return minutes >= range.start && minutes < range.end;
      }
      return minutes >= range.start || minutes < range.end;
    });
  }

  private deriveWeeklyFromOpeningHours(lines?: string[] | null): OpeningHoursWeekly | null {
    if (!lines || !Array.isArray(lines)) {
      return null;
    }
    const weekly = WEEK_DAYS.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {} as OpeningHoursWeekly);
    let hasAny = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const separatorIndex = trimmed.indexOf(':');
      if (separatorIndex === -1) return;
      const dayPart = trimmed.slice(0, separatorIndex).trim();
      const timePart = trimmed.slice(separatorIndex + 1).trim();
      const days = parseDayPart(dayPart);
      if (!days.length) return;
      if (/closed|off/i.test(timePart)) {
        days.forEach((day) => {
          weekly[dayKeyToWeekly[day]] = [];
        });
        hasAny = true;
        return;
      }
      const ranges = parseTimeRanges(timePart);
      if (!ranges.length) return;
      days.forEach((day) => {
        ranges.forEach((range) => {
          const start = toMinutes(range.start);
          const end = toMinutes(range.end);
          if (start == null || end == null || start === end) {
            return;
          }
          weekly[dayKeyToWeekly[day]].push({ start, end });
          hasAny = true;
        });
      });
    });
    return hasAny ? weekly : null;
  }

  async remove(id: string, ownerId: string) {
    const store = await this.requireOwnedStore(id, ownerId);
    const products = await this.productsRepository.find({ where: { storeId: store.id } });
    await Promise.all(
      products.map(async (product) => {
        await this.media.deleteImage(product.imagePublicId, product.imageUrl);
      }),
    );
    if (products.length) {
      await this.productsRepository.softRemove(products);
    }
    await this.media.deleteImage(store.imagePublicId, store.imageUrl);
    return this.storesRepository.softRemove(store);
  }

  private async requireOwnedStore(id: string, ownerId: string) {
    const store = await this.storesRepository.findOne({ where: { id }, relations: ['vendor'] });
    if (!store || store.deletedAt) {
      throw new NotFoundException('Store not found');
    }
    if (!store.vendor || store.vendor.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to manage this store');
    }
    return store;
  }

  private async requireVendor(ownerId: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
    if (!vendor) {
      throw new ForbiddenException('Vendor onboarding required before managing stores');
    }
    if (vendor.status !== 'active') {
      throw new ForbiddenException('Vendor account is not active');
    }
    const entitlements = await this.billingService.getVendorEntitlements(vendor.id);
    if (!entitlements?.isActive || (entitlements.storesAllowed !== null && entitlements.storesAllowed <= 0)) {
      throw new ForbiddenException('Store creation and activation are blocked: plan inactive or limit reached');
    }
    return vendor;
  }

  private handleSlugCollision(error: unknown): never {
    const isQueryError = error instanceof QueryFailedError;
    if (
      isQueryError &&
      (error.driverError?.code === '23505' || error.driverError?.routine === '_bt_check_unique') &&
      (error.driverError?.constraint === 'IDX_790b2968701a6ff5ff38323776' ||
        error.driverError?.constraint === 'stores_slug_active_idx')
    ) {
      throw new ConflictException('Store slug already in use. Try a different slug.');
    }
    throw error;
  }

  private async geocodeAddress(store: Pick<Store, 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'postalCode'>) {
    const token = this.config.get<string>('MAPBOX_TOKEN');
    if (!token) {
      this.logger.warn('MAPBOX_TOKEN not set; skipping geocoding');
      return null;
    }
    const addressParts = [store.addressLine1, store.addressLine2, store.city, store.state, store.postalCode]
      .filter(Boolean)
      .join(', ');
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressParts)}.json?access_token=${token}&limit=1&autocomplete=false`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`Mapbox geocode failed: ${response.status} ${response.statusText}`);
        return null;
      }
      const data = (await response.json()) as { features?: { center?: [number, number] }[] };
      const coords = data.features?.[0]?.center;
      if (coords && coords.length === 2) {
        return { longitude: coords[0], latitude: coords[1] };
      }
    } catch (error) {
      this.logger.warn(`Mapbox geocode error: ${(error as Error)?.message ?? error}`);
    }
    return null;
  }
}
