import type {
  Appliance,
  Insight,
  MeterReading,
  UsageSummary,
} from '../../../../types/solarbright-energy';

export const usageSummary: UsageSummary = {
  currentMonthUnits: 428,
  projectedBill: 3860,
  dailyAverage: 14.3,
  peakUsageWindow: '7 PM - 11 PM',
  changePercent: -8,
};

export const meterReadings: MeterReading[] = [
  {
    id: 'apr-15',
    source: 'upload',
    reading: 18246,
    confidence: 96,
    recordedAt: '2026-04-15 08:30 AM',
    note: 'Upload from main meter image',
  },
  {
    id: 'apr-01',
    source: 'camera',
    reading: 17818,
    confidence: 93,
    recordedAt: '2026-04-01 09:10 AM',
    note: 'Start of billing cycle',
  },
  {
    id: 'mar-15',
    source: 'scan',
    reading: 17392,
    confidence: 89,
    recordedAt: '2026-03-15 07:55 PM',
  },
];

export const appliances: Appliance[] = [
  {
    id: 'ac-main',
    name: 'Inverter AC',
    category: 'Cooling',
    quantity: 2,
    wattage: 1500,
    hoursPerDay: 6,
    usagePattern: 'Evening heavy use',
    monthlyUnits: 324,
  },
  {
    id: 'fridge',
    name: 'Refrigerator',
    category: 'Kitchen',
    quantity: 1,
    wattage: 250,
    hoursPerDay: 24,
    usagePattern: 'Always on',
    monthlyUnits: 180,
  },
  {
    id: 'washer',
    name: 'Washing Machine',
    category: 'Laundry',
    quantity: 1,
    wattage: 700,
    hoursPerDay: 1,
    usagePattern: '4 cycles per week',
    monthlyUnits: 21,
  },
  {
    id: 'lights',
    name: 'LED Lighting',
    category: 'Lighting',
    quantity: 14,
    wattage: 12,
    hoursPerDay: 5,
    usagePattern: 'Distributed across rooms',
    monthlyUnits: 25,
  },
];


export const insights: Insight[] = [
  {
    id: 'ac-peak',
    title: 'Cooling drives 58% of your monthly usage',
    detail: 'Shift one AC usage block by 2 hours or increase thermostat by 1 degree to cut monthly units.',
    tone: 'warning',
  },
  {
    id: 'reading-trend',
    title: 'Your projected bill is down 8% vs last cycle',
    detail: 'Reduced evening usage and better appliance scheduling are improving the overall bill.',
    tone: 'positive',
  },
  {
    id: 'fridge-check',
    title: 'Base load remains stable',
    detail: 'Always-on appliances like the refrigerator and router are behaving consistently this month.',
    tone: 'neutral',
  },
];
