import { HormoneFormFactor, HormoneLogType } from '../../../entities/hormone-log.entity';

export interface HormoneLogResponseDto {
  id: string;
  logType: HormoneLogType;
  testosteroneLevel: number | null;
  estradiolLevel: number | null;
  doseMg: number | null;
  formFactor: HormoneFormFactor | null;
  dateTaken: string;
  moodScore: number | null;
  moodNotes: string | null;
  erectionStrength: number | null;
  morningErections: number | null;
  libido: number | null;
  sexualThoughts: number | null;
  energyLevels: number | null;
  moodStability: number | null;
  strengthEndurance: number | null;
  concentrationSharpness: number | null;
  bodyComposition: number | null;
  sleepQuality: number | null;
  exerciseDurationMinutes: number | null;
  exerciseIntensity: string | null;
  sleepHours: number | null;
  stressLevel: number | null;
  weightLbs: number | null;
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
