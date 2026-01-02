import type { MigrationInterface, QueryRunner } from 'typeorm';

type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
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

const deriveWeeklyFromOpeningHours = (lines?: string[] | null): OpeningHoursWeekly | null => {
  if (!lines || !Array.isArray(lines)) {
    return null;
  }
  const weekly = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).reduce((acc, day) => {
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
};

export class BackfillStoreWeeklyHours1773100000000 implements MigrationInterface {
  name = 'BackfillStoreWeeklyHours1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ id: string; opening_hours: string[] | null }> = await queryRunner.query(
      `SELECT id, opening_hours FROM core.stores WHERE opening_hours_weekly IS NULL AND opening_hours IS NOT NULL`,
    );
    for (const row of rows) {
      const weekly = deriveWeeklyFromOpeningHours(row.opening_hours);
      if (!weekly) continue;
      await queryRunner.query(
        `UPDATE core.stores SET opening_hours_weekly = $1::jsonb WHERE id = $2`,
        [JSON.stringify(weekly), row.id],
      );
    }
  }

  public async down(): Promise<void> {
    // No-op: cannot safely distinguish derived schedules from user-provided ones.
  }
}
