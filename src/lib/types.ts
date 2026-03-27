export interface Baby {
  id?: string; // UUID, primary key in supabase
  recordName?: string; // deprecated, kept for localStorage compat
  name: string;
  birthDate: string; // ISO date string
  gender: 'male' | 'female';
  prematureBirthDate?: string; // ISO date string for premature babies
  avatar?: string; // base64 data URL for custom avatar
}

export interface GrowthRecord {
  id?: string; // UUID, primary key in supabase
  recordName?: string; // deprecated, kept for localStorage compat
  babyId: string;
  date: string; // ISO date string
  weight?: number; // kg
  height?: number; // cm
  headCircumference?: number; // cm
}

export type MeasureType = 'weight' | 'height' | 'headCircumference';

export type GrowthStandard = 'WHO' | 'CDC';

export interface PercentileData {
  months: number[];
  P1: number[];
  P3: number[];
  P15: number[];
  P50: number[];
  P85: number[];
  P97: number[];
  P99: number[];
}

export interface GrowthStandardData {
  weight: {
    boys: PercentileData;
    girls: PercentileData;
  };
  height: {
    boys: PercentileData;
    girls: PercentileData;
  };
  headCircumference: {
    boys: PercentileData;
    girls: PercentileData;
  };
}
