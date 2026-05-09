export interface HoursShift {
  id: string;
  serviceName: string;
  openTime: string;
  closeTime: string;
  prepHours: number;
  shutdownHours: number;
}

export interface VenueWindow {
  openTime: string;
  closeTime: string;
}

export interface DaySchedule {
  isOpen: boolean;
  venueWindows?: VenueWindow[];
  shifts: HoursShift[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface ShiftWithBounds {
  shift: HoursShift;
  startDec: number;
  endDec: number;
  id: string;
  index: number;
}

export interface ShiftLane {
  shifts: ShiftWithBounds[];
}

export interface TimeSegment {
  startDec: number;
  endDec: number;
  shifts: ShiftWithBounds[];
}

export interface VenueWindowBounds {
  startDec: number;
  endDec: number;
}

export interface DayVisualizationData {
  day: string;
  dayLabel: string;
  daySchedule: DaySchedule;
  lanes: ShiftLane[];
  segments: TimeSegment[];
  earliestStart: number;
  latestEnd: number;
  venueWindowBounds: VenueWindowBounds[];
}

export interface WeeklySummary {
  openDaysCount: number;
  totalTradingHours: number;
  totalNonTradingHours: number;
  serviceBreakdown: Record<string, number>;
  weekdayCount: number;
  weekendCount: number;
}

export interface HoursVisualizationData {
  weeklySchedule: WeeklySchedule;
  days: DayVisualizationData[];
  summary: WeeklySummary;
  serviceColors: Record<string, string>;
  globalEarliestStart: number;
  globalLatestEnd: number;
  overallDuration: number;
}

export const SERVICE_COLOR_MAP: Record<string, string> = {
  'breakfast': '#fbbf24',
  'lunch': '#34d399',
  'happy hour': '#a78bfa',
  'dinner': '#60a5fa',
  'brunch': '#fb7185',
  'late night': '#fb923c',
};

export const PREP_CLOSE_COLOR = '#a1a5aa';

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type DayKey = typeof DAY_KEYS[number];
