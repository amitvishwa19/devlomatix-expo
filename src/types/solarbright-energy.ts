import type { RelativePathString } from 'expo-router';

export type CaptureMode = 'scan' | 'camera' | 'upload';

export type ApplianceCategory =
  | 'Cooling'
  | 'Kitchen'
  | 'Laundry'
  | 'Lighting'
  | 'Entertainment'
  | 'Water'
  | 'Work';

export type MeterReading = {
  id: string;
  source: CaptureMode;
  reading: number;
  confidence: number;
  recordedAt: string;
  note?: string;
};

export type Appliance = {
  id: string;
  name: string;
  category: ApplianceCategory;
  quantity: number;
  wattage: number;
  hoursPerDay: number;
  usagePattern: string;
  monthlyUnits: number;
};

export type UsageSummary = {
  currentMonthUnits: number;
  projectedBill: number;
  dailyAverage: number;
  peakUsageWindow: string;
  changePercent: number;
};

export type Insight = {
  id: string;
  title: string;
  detail: string;
  tone: 'warning' | 'positive' | 'neutral';
};

export type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: RelativePathString;
};
