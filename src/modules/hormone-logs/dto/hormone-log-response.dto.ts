export interface HormoneLogResponseDto {
  id: string;
  logType: string;
  testosteroneLevel: number | null;
  estradiolLevel: number | null;
  doseMg: number | null;
  formFactor: string | null;
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
