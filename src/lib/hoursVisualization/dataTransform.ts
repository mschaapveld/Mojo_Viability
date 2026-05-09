import {
  WeeklySchedule,
  ShiftWithBounds,
  ShiftLane,
  DayVisualizationData,
  WeeklySummary,
  HoursVisualizationData,
  SERVICE_COLOR_MAP,
  DAY_KEYS,
  DAY_LABELS,
  TimeSegment,
} from './types';

export function timeToDecimal(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours + (minutes || 0) / 60;
}

export function checkShiftsOverlap(shift1: ShiftWithBounds, shift2: ShiftWithBounds): boolean {
  return !(shift1.endDec <= shift2.startDec || shift2.endDec <= shift1.startDec);
}

export function computeTimeSegments(shifts: ShiftWithBounds[]): TimeSegment[] {
  if (shifts.length === 0) return [];

  const boundaries = new Set<number>();

  shifts.forEach((swb) => {
    const prepStart = swb.startDec - swb.shift.prepHours;
    const shutdownEnd = swb.endDec + swb.shift.shutdownHours;

    if (swb.shift.prepHours > 0) {
      boundaries.add(prepStart);
    }
    boundaries.add(swb.startDec);
    boundaries.add(swb.endDec);
    if (swb.shift.shutdownHours > 0) {
      boundaries.add(shutdownEnd);
    }
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const segments: TimeSegment[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const segStart = sortedBoundaries[i];
    const segEnd = sortedBoundaries[i + 1];

    const activeShifts = shifts.filter((swb) => {
      const prepStart = swb.startDec - swb.shift.prepHours;
      const shutdownEnd = swb.endDec + swb.shift.shutdownHours;
      return segStart >= prepStart && segEnd <= shutdownEnd;
    });

    if (activeShifts.length > 0) {
      segments.push({
        startDec: segStart,
        endDec: segEnd,
        shifts: activeShifts,
      });
    }
  }

  return segments;
}

export function assignShiftsToLanes(shifts: ShiftWithBounds[]): ShiftLane[] {
  const lanes: ShiftLane[] = [];

  for (const shift of shifts) {
    let assignedToLane = false;

    for (const lane of lanes) {
      const overlapsWithAnyInLane = lane.shifts.some(s => checkShiftsOverlap(shift, s));
      if (!overlapsWithAnyInLane) {
        lane.shifts.push(shift);
        assignedToLane = true;
        break;
      }
    }

    if (!assignedToLane) {
      lanes.push({ shifts: [shift] });
    }
  }

  return lanes;
}

export function transformWeeklyScheduleToVisualizationData(
  weeklySchedule: WeeklySchedule
): HoursVisualizationData | null {
  // Check for days that either have shifts OR have venue windows
  const openDays = DAY_KEYS.filter(day => {
    const dayData = weeklySchedule[day];
    if (!dayData) return false;

    const hasVenueWindows = dayData.venueWindows && dayData.venueWindows.length > 0;
    const hasShifts = dayData.shifts && dayData.shifts.some(s => s.openTime && s.closeTime);

    return dayData.isOpen || hasVenueWindows || hasShifts;
  });

  if (openDays.length === 0) {
    return null;
  }

  const uniqueServices = new Set<string>();
  openDays.forEach(day => {
    const dayData = weeklySchedule[day];
    if (dayData?.shifts) {
      dayData.shifts.forEach((shift) => {
        if (shift.serviceName && shift.openTime && shift.closeTime) {
          uniqueServices.add(shift.serviceName.toLowerCase());
        }
      });
    }
  });

  const serviceColors: Record<string, string> = {};
  Array.from(uniqueServices).forEach((service) => {
    serviceColors[service] = SERVICE_COLOR_MAP[service] || '#94a3b8';
  });

  let globalEarliestStart = 24;
  let globalLatestEnd = 0;
  let totalTradingHours = 0;
  let totalNonTradingHours = 0;
  const serviceHours: Record<string, number> = {};

  const daysData: DayVisualizationData[] = [];

  openDays.forEach((day) => {
    const daySchedule = weeklySchedule[day];
    if (!daySchedule) return;

    // Check if day has venue windows
    const hasVenueWindows = daySchedule.venueWindows && daySchedule.venueWindows.length > 0;

    // Check if day has valid shifts
    const hasValidShifts = daySchedule.shifts && daySchedule.shifts.some((s) => s.openTime && s.closeTime);

    // Skip day if it has neither venue windows nor valid shifts
    if (!hasVenueWindows && !hasValidShifts) return;

    const shiftsWithBounds: ShiftWithBounds[] = hasValidShifts
      ? daySchedule.shifts
          .map((shift, shiftIndex) => {
            if (!shift.openTime || !shift.closeTime) return null;
            let startDec = timeToDecimal(shift.openTime);
            let endDec = timeToDecimal(shift.closeTime);
            if (endDec < startDec) endDec += 24;
            return {
              shift,
              startDec,
              endDec,
              id: shift.id || `${day}-${shiftIndex}`,
              index: 0
            };
          })
          .filter((s): s is ShiftWithBounds => s !== null)
      : [];

    const lanes = assignShiftsToLanes(shiftsWithBounds);

    shiftsWithBounds.forEach((swb) => {
      lanes.forEach((lane, laneIndex) => {
        if (lane.shifts.some(s => s.id === swb.id)) {
          swb.index = laneIndex;
        }
      });
    });

    const segments = shiftsWithBounds.length > 0 ? computeTimeSegments(shiftsWithBounds) : [];

    let dayEarliestStart = 24;
    let dayLatestEnd = 0;

    // Calculate bounds from shifts if they exist
    shiftsWithBounds.forEach((swb) => {
      const { startDec, endDec, shift } = swb;

      const hours = endDec - startDec;
      totalTradingHours += hours;

      const serviceLower = shift.serviceName.toLowerCase();
      serviceHours[serviceLower] = (serviceHours[serviceLower] || 0) + hours;

      if (shift.prepHours > 0) {
        dayEarliestStart = Math.min(dayEarliestStart, startDec - shift.prepHours);
        totalNonTradingHours += shift.prepHours;
      } else {
        dayEarliestStart = Math.min(dayEarliestStart, startDec);
      }

      if (shift.shutdownHours > 0) {
        dayLatestEnd = Math.max(dayLatestEnd, endDec + shift.shutdownHours);
        totalNonTradingHours += shift.shutdownHours;
      } else {
        dayLatestEnd = Math.max(dayLatestEnd, endDec);
      }
    });

    // Process venue opening windows
    const venueWindowBounds: { startDec: number; endDec: number }[] = [];
    if (daySchedule.venueWindows && daySchedule.venueWindows.length > 0) {
      daySchedule.venueWindows.forEach(window => {
        let startDec = timeToDecimal(window.openTime);
        let endDec = timeToDecimal(window.closeTime);
        if (endDec <= startDec) {
          endDec += 24;
        }
        venueWindowBounds.push({ startDec, endDec });

        dayEarliestStart = Math.min(dayEarliestStart, startDec);
        dayLatestEnd = Math.max(dayLatestEnd, endDec);
      });
    }

    globalEarliestStart = Math.min(globalEarliestStart, dayEarliestStart);
    globalLatestEnd = Math.max(globalLatestEnd, dayLatestEnd);

    daysData.push({
      day,
      dayLabel: DAY_LABELS[DAY_KEYS.indexOf(day)],
      daySchedule,
      lanes,
      segments,
      earliestStart: dayEarliestStart,
      latestEnd: dayLatestEnd,
      venueWindowBounds,
    });
  });

  if (globalEarliestStart === 24) {
    globalEarliestStart = 0;
  }
  if (globalLatestEnd === 0) {
    globalLatestEnd = 24;
  }

  const overallDuration = globalLatestEnd - globalEarliestStart;

  const weekdayCount = openDays.filter(day => !['saturday', 'sunday'].includes(day)).length;
  const weekendCount = openDays.filter(day => ['saturday', 'sunday'].includes(day)).length;

  const summary: WeeklySummary = {
    openDaysCount: openDays.length,
    totalTradingHours,
    totalNonTradingHours,
    serviceBreakdown: serviceHours,
    weekdayCount,
    weekendCount,
  };

  return {
    weeklySchedule,
    days: daysData,
    summary,
    serviceColors,
    globalEarliestStart,
    globalLatestEnd,
    overallDuration,
  };
}
