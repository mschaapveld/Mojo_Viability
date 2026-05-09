import { parseTimeInput } from './timeUtils';

export interface ParsedVenueHours {
  days: string[];
  open: string;
  close: string;
}

export interface ParsedShift {
  days: string[];
  service: string;
  open: string;
  close: string;
  prep: number;
  shutdown: number;
}

export interface ParseResult {
  venueHours: ParsedVenueHours[];
  shifts: ParsedShift[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const dayGroups: { [key: string]: string[] } = {
  'every day': DAYS,
  'everyday': DAYS,
  'daily': DAYS,
  '7 days': DAYS,
  'all days': DAYS,
  weekday: ['monday', 'tuesday', 'wednesday', 'thursday'],
  weekdays: ['monday', 'tuesday', 'wednesday', 'thursday'],
  weekend: ['saturday', 'sunday'],
  weekends: ['saturday', 'sunday'],
  monday: ['monday'],
  tuesday: ['tuesday'],
  wednesday: ['wednesday'],
  thursday: ['thursday'],
  friday: ['friday'],
  saturday: ['saturday'],
  sunday: ['sunday'],
  mondays: ['monday'],
  tuesdays: ['tuesday'],
  wednesdays: ['wednesday'],
  thursdays: ['thursday'],
  fridays: ['friday'],
  saturdays: ['saturday'],
  sundays: ['sunday'],
  mon: ['monday'],
  tue: ['tuesday'],
  tues: ['tuesday'],
  wed: ['wednesday'],
  thu: ['thursday'],
  thur: ['thursday'],
  thurs: ['thursday'],
  fri: ['friday'],
  sat: ['saturday'],
  sun: ['sunday'],
};

function parseDayRange(text: string): string[] {
  // Handle day ranges like "Sunday - Wednesday" or "Thursday - Saturday"
  const rangeMatch = text.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun)\s*-\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun)/i);

  if (rangeMatch) {
    const start = rangeMatch[1].toLowerCase();
    const end = rangeMatch[2].toLowerCase();

    // Normalize short forms to full names
    const dayMap: { [key: string]: string } = {
      mon: 'monday', tue: 'tuesday', tues: 'tuesday', wed: 'wednesday',
      thu: 'thursday', thur: 'thursday', thurs: 'thursday', fri: 'friday',
      sat: 'saturday', sun: 'sunday'
    };

    const startDay = dayMap[start] || start;
    const endDay = dayMap[end] || end;

    const startIdx = DAYS.indexOf(startDay);
    const endIdx = DAYS.indexOf(endDay);

    if (startIdx >= 0 && endIdx >= 0) {
      if (startIdx <= endIdx) {
        return DAYS.slice(startIdx, endIdx + 1);
      } else {
        // Wrap around (e.g., Friday - Monday)
        return [...DAYS.slice(startIdx), ...DAYS.slice(0, endIdx + 1)];
      }
    }
  }

  return [];
}

export function parseGlobalSchedule(text: string): ParseResult {
  const lowerText = text.toLowerCase();
  const venueHours: ParsedVenueHours[] = [];
  const shifts: ParsedShift[] = [];

  const venuePatterns = [
    /(?:we're\s+)?open\s+(?:on\s+)?(weekday|weekdays|weekend|weekends|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays)(?:\s+and\s+(weekday|weekdays|weekend|weekends|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays))?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|till|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midnight|12am)/gi,
    /(?:,\s*)?(?:we're\s+)?(?:open\s+)?(weekday|weekdays|weekend|weekends|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays)\s+and\s+(weekday|weekdays|weekend|weekends|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|till|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midnight|12am)/gi,
  ];

  venuePatterns.forEach(venuePattern => {
    let match;
    while ((match = venuePattern.exec(lowerText)) !== null) {
      const dayGroup1 = match[1];
      const dayGroup2 = match[2];
      const openStr = match[3];
      let closeStr = match[4];

      const openTime = parseTimeInput(openStr);
      let closeTime: string | null = null;

      if (closeStr === 'midnight' || closeStr === '12am') {
        closeTime = '23:59';
      } else {
        closeTime = parseTimeInput(closeStr);
      }

      if (openTime && closeTime) {
        const days = [...(dayGroups[dayGroup1] || [])];
        if (dayGroup2 && dayGroups[dayGroup2]) {
          dayGroups[dayGroup2].forEach(d => {
            if (!days.includes(d)) days.push(d);
          });
        }
        venueHours.push({ days, open: openTime, close: closeTime });
      }
    }
  });

  // Service with specific days: service, days, open, close
  interface ServiceWithDays {
    service: string;
    days: string[];
    open: string;
    close: string;
  }

  const servicesWithDays: ServiceWithDays[] = [];

  // Pattern for service times WITH day specifications
  // e.g., "Dinner 5pm-9 Sunday - Wednesday" or "Lunch 11:30am-5pm every day"
  const serviceDayPatterns = [
    /(lunch|breakfast|dinner|happy\s+hour|brunch)\s+(?:will\s+be\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+((?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\s*-\s*(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)|every\s+day|everyday|daily|7\s+days|weekday|weekdays|weekend|weekends)/gi,
  ];

  serviceDayPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      let serviceName = match[1].trim();
      serviceName = serviceName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      let openStr = match[2];
      let closeStr = match[3];
      const dayText = match[4];

      // Handle cases like "4-6pm" or "5pm-11" where am/pm applies to both times
      if (!openStr.match(/am|pm/i) && closeStr.match(/pm/i)) {
        openStr = openStr + 'pm';
      } else if (!openStr.match(/am|pm/i) && closeStr.match(/am/i)) {
        openStr = openStr + 'am';
      } else if (!closeStr.match(/am|pm/i) && openStr.match(/pm/i)) {
        closeStr = closeStr + 'pm';
      } else if (!closeStr.match(/am|pm/i) && openStr.match(/am/i)) {
        closeStr = closeStr + 'am';
      }

      const openTime = parseTimeInput(openStr);
      const closeTime = parseTimeInput(closeStr);

      // Parse day specification
      let days: string[] = [];
      const dayRange = parseDayRange(dayText);
      if (dayRange.length > 0) {
        days = dayRange;
      } else {
        const normalizedDayText = dayText.toLowerCase().trim();
        days = dayGroups[normalizedDayText] || DAYS;
      }

      if (openTime && closeTime && days.length > 0) {
        servicesWithDays.push({ service: serviceName, days, open: openTime, close: closeTime });
      }
    }
  });

  // Pattern for service times WITHOUT day specifications (applies to all days)
  const serviceMap: { [key: string]: { open: string, close: string } } = {};

  const servicePatterns = [
    /(?:we\s+)?(?:open\s+for|offer)\s+(lunch|breakfast|dinner|happy\s+hour|brunch)\s+(?:from\s+)?(?:(?:at|from)\s+)?(midday|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|till|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
    /(lunch|breakfast|dinner|happy\s+hour|brunch)\s+(?:will\s+be\s+)?(?:from\s+)?(midday|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|till|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
  ];

  servicePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      let serviceName = match[1].trim();
      serviceName = serviceName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      let openStr = match[2];
      if (openStr === 'midday' || openStr === 'noon') openStr = '12:00 PM';

      let closeStr = match[3];

      // Handle cases like "4-6pm" or "5pm-11" where am/pm applies to both times
      if (!openStr.match(/am|pm/i) && closeStr.match(/pm/i)) {
        openStr = openStr + 'pm';
      } else if (!openStr.match(/am|pm/i) && closeStr.match(/am/i)) {
        openStr = openStr + 'am';
      } else if (!closeStr.match(/am|pm/i) && openStr.match(/pm/i)) {
        closeStr = closeStr + 'pm';
      } else if (!closeStr.match(/am|pm/i) && openStr.match(/am/i)) {
        closeStr = closeStr + 'am';
      }

      const openTime = parseTimeInput(openStr);
      const closeTime = parseTimeInput(closeStr);

      if (openTime && closeTime) {
        // Only add if this service hasn't been specified with days already
        const alreadyHasDaySpec = servicesWithDays.some(s => s.service === serviceName);
        if (!alreadyHasDaySpec) {
          serviceMap[serviceName] = { open: openTime, close: closeTime };
        }
      }
    }
  });

  const prepShutdownMap: { [key: string]: { prep: number, shutdown: number } } = {};
  let firstShiftPrepHours = 0;

  // Patterns for prep that applies to FIRST SHIFT ONLY (every day, before open, etc.)
  const firstShiftPrepPatterns = [
    /(?:prep\s+shift\s+)?(?:every\s+day\s+)?(?:(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+(?:prep\s+)?(?:before\s+open|at\s+the\s+start)/gi,
    /(?:(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+prep\s+(?:shift\s+)?(?:every\s+day|daily)(?!\s+for)/gi,
  ];

  firstShiftPrepPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      firstShiftPrepHours = match[1] ? parseFloat(match[1]) : 1;
    }
  });

  // Patterns for prep that applies to SPECIFIC or ALL services
  const servicePrepPatterns = [
    /(?:(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+prep\s+at\s+the\s+start\s+of\s+((?:lunch|breakfast|dinner|happy\s+hour)(?:\s+and\s+(?:the\s+start\s+of\s+)?(?:lunch|breakfast|dinner|happy\s+hour))*)/gi,
    /(?:(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+prep\s+for\s+(?:each\s+service|all\s+services)/gi,
  ];

  servicePrepPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      const hours = match[1] ? parseFloat(match[1]) : 1;
      const servicesText = match[2] ? match[2].trim() : '';

      if (servicesText && (servicesText.includes('each service') || servicesText.includes('all services'))) {
        const allServiceNames = new Set([
          ...Object.keys(serviceMap),
          ...servicesWithDays.map(s => s.service)
        ]);

        allServiceNames.forEach((serviceName: string) => {
          if (!prepShutdownMap[serviceName]) {
            prepShutdownMap[serviceName] = { prep: hours, shutdown: 0 };
          } else {
            prepShutdownMap[serviceName].prep = hours;
          }
        });
      } else if (servicesText) {
        const serviceMatches = servicesText.match(/lunch|breakfast|dinner|happy\s+hour/gi) || [];

        serviceMatches.forEach((service: string) => {
          let serviceName = service.trim();
          serviceName = serviceName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          if (!prepShutdownMap[serviceName]) {
            prepShutdownMap[serviceName] = { prep: hours, shutdown: 0 };
          } else {
            prepShutdownMap[serviceName].prep = hours;
          }
        });
      } else {
        // "for each service" or "for all services" implied
        const allServiceNames = new Set([
          ...Object.keys(serviceMap),
          ...servicesWithDays.map(s => s.service)
        ]);

        allServiceNames.forEach((serviceName: string) => {
          if (!prepShutdownMap[serviceName]) {
            prepShutdownMap[serviceName] = { prep: hours, shutdown: 0 };
          } else {
            prepShutdownMap[serviceName].prep = hours;
          }
        });
      }
    }
  });

  const shutdownForAllPattern = /(?:a\s+)?(?:(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)|(\d+(?:\.\d+)?)\s*hours?|an?\s+hour|one\s+hour)\s+shut\s*down\s+for\s+(?:each\s+service|all\s+services)/gi;

  let shutdownAllMatch;
  while ((shutdownAllMatch = shutdownForAllPattern.exec(lowerText)) !== null) {
    let hours = 0;
    if (shutdownAllMatch[1]) {
      hours = parseFloat(shutdownAllMatch[1]) / 60;
    } else if (shutdownAllMatch[2]) {
      hours = parseFloat(shutdownAllMatch[2]);
    } else {
      hours = 1;
    }

    const allServiceNames = new Set([
      ...Object.keys(serviceMap),
      ...servicesWithDays.map(s => s.service)
    ]);

    allServiceNames.forEach((serviceName: string) => {
      if (!prepShutdownMap[serviceName]) {
        prepShutdownMap[serviceName] = { prep: 0, shutdown: hours };
      } else {
        prepShutdownMap[serviceName].shutdown = hours;
      }
    });
  }

  const shutdownPatterns = [
    /(?:close\s+)?(?:(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)|(\d+(?:\.\d+)?)\s*hours?|an?\s+hour|one\s+hour)\s+(?:every\s+day\s+)?after\s+(lunch|breakfast|dinner|happy\s+hour)/gi,
    /(?:a\s+)?(?:(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)|(\d+(?:\.\d+)?)\s*hours?|an?\s+hour|one\s+hour)\s+(?:to\s+)?close\s+(?:the\s+bistro\s+)?(?:at\s+)?((?:lunch|breakfast|dinner|happy\s+hour)(?:\s+and\s+(?:lunch|breakfast|dinner|happy\s+hour))*)/gi,
    /(?:(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)|(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+to\s+close\s+(?:the\s+bistro\s+)?(?:at\s+)?(lunch|after\s+lunch|after\s+dinner|dinner|breakfast|happy\s+hour)/gi,
    /(?:need|requires?)\s+(?:(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)|(\d+(?:\.\d+)?)\s*hours?|an?\s+hour)\s+to\s+close\s+(?:the\s+bistro\s+)?(?:at\s+)?(?:after\s+)?(lunch|dinner|breakfast|happy\s+hour)/gi,
  ];

  shutdownPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      let hours = 0;
      if (match[1]) {
        hours = parseFloat(match[1]) / 60;
      } else if (match[2]) {
        hours = parseFloat(match[2]);
      } else {
        hours = 1;
      }

      const servicesText = match[3];

      const serviceMatches = servicesText.match(/lunch|breakfast|dinner|happy\s+hour/gi) || [];

      serviceMatches.forEach((service: string) => {
        let serviceName = service.trim();

        if (serviceName.includes('dinner')) serviceName = 'Dinner';
        else if (serviceName.includes('breakfast')) serviceName = 'Breakfast';
        else if (serviceName.includes('happy')) serviceName = 'Happy Hour';
        else if (serviceName.includes('lunch')) serviceName = 'Lunch';

        serviceName = serviceName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        if (!prepShutdownMap[serviceName]) {
          prepShutdownMap[serviceName] = { prep: 0, shutdown: hours };
        } else {
          prepShutdownMap[serviceName].shutdown = hours;
        }
      });
    }
  });

  // Add shifts from servicesWithDays (day-specific schedules)
  servicesWithDays.forEach(({ service, days, open, close }) => {
    const prepShutdown = prepShutdownMap[service] || { prep: 0, shutdown: 0 };
    shifts.push({
      days,
      service,
      open,
      close,
      prep: prepShutdown.prep,
      shutdown: prepShutdown.shutdown,
    });
  });

  // Add shifts from serviceMap (applies to all days, unless already handled by servicesWithDays)
  Object.entries(serviceMap).forEach(([serviceName, times]) => {
    const prepShutdown = prepShutdownMap[serviceName] || { prep: 0, shutdown: 0 };
    shifts.push({
      days: DAYS,
      service: serviceName,
      open: times.open,
      close: times.close,
      prep: prepShutdown.prep,
      shutdown: prepShutdown.shutdown,
    });
  });

  // Apply first-shift prep to the earliest shift of each day
  if (firstShiftPrepHours > 0) {
    DAYS.forEach((day: string) => {
      // Find all shifts that operate on this day
      const shiftsForDay = shifts.filter(shift => shift.days.includes(day));

      if (shiftsForDay.length > 0) {
        // Find the earliest opening time for this day
        const earliestTime = shiftsForDay.reduce((earliest, shift) => {
          return shift.open < earliest ? shift.open : earliest;
        }, shiftsForDay[0].open);

        // Apply prep to all shifts with the earliest opening time on this day
        shiftsForDay.forEach(shift => {
          if (shift.open === earliestTime) {
            // Find the actual shift object in the shifts array and update it
            const shiftIndex = shifts.findIndex(s =>
              s.service === shift.service &&
              s.open === shift.open &&
              s.close === shift.close &&
              s.days.some(d => shift.days.includes(d))
            );
            if (shiftIndex !== -1) {
              shifts[shiftIndex].prep = Math.max(shifts[shiftIndex].prep, firstShiftPrepHours);
            }
          }
        });
      }
    });
  }

  return { venueHours, shifts };
}
