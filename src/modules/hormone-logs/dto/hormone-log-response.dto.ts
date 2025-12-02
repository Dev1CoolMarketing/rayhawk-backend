import { HormoneFormFactor } from '../../../entities/hormone-log.entity';

export interface HormoneLogResponseDto {
  id: string;
  testosteroneLevel: number;
  estradiolLevel: number;
  doseMg: number;
  formFactor: HormoneFormFactor;
  dateTaken: string;
  moodScore: number;
  moodNotes: string | null;
  createdAt: string;
}

export interface HormoneLogSummaryDto {
  avgTestosterone: number | null;
  avgEstradiol: number | null;
  avgDoseMg: number | null;
  totalLogs: number;
  byFormFactor: { formFactor: HormoneFormFactor; count: number; avgTestosterone: number | null }[];
  byMood: { moodScore: number; count: number }[];
}
