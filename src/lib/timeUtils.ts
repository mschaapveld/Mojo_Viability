export function parseTimeInput(input: string): string | null {
  if (!input) return null;

  const patterns = [
    { regex: /^(\d{1,2}):(\d{2})([ap]m?)?$/, handler: handleColonFormat },
    { regex: /^(\d{3,4})([ap]m?)?$/, handler: handleNoColonFormat },
    { regex: /^(\d{1,2})([ap]m?)$/, handler: handleShortFormat }
  ];

  for (const { regex, handler } of patterns) {
    const match = input.match(regex);
    if (match) {
      return handler(match);
    }
  }

  return null;
}

function handleColonFormat(match: RegExpMatchArray): string | null {
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const meridiem = match[3];

  if (minutes > 59) return null;

  if (meridiem) {
    const isPM = meridiem.startsWith('p');
    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else if (isPM) {
      hours += 12;
    }
  }

  if (hours > 23) return null;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function handleNoColonFormat(match: RegExpMatchArray): string | null {
  const digits = match[1];
  const meridiem = match[2];

  let hours: number;
  let minutes: number;

  if (digits.length === 3) {
    hours = parseInt(digits[0]);
    minutes = parseInt(digits.substring(1));
  } else {
    hours = parseInt(digits.substring(0, 2));
    minutes = parseInt(digits.substring(2));
  }

  if (minutes > 59) return null;

  if (meridiem) {
    const isPM = meridiem.startsWith('p');
    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else if (isPM) {
      hours += 12;
    }
  }

  if (hours > 23) return null;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function handleShortFormat(match: RegExpMatchArray): string | null {
  let hours = parseInt(match[1]);
  const meridiem = match[2];

  const isPM = meridiem.startsWith('p');
  if (hours === 12) {
    hours = isPM ? 12 : 0;
  } else if (isPM) {
    hours += 12;
  }

  if (hours > 23) return null;

  return `${hours.toString().padStart(2, '0')}:00`;
}

export type TimeFormat = '12h' | '24h';

export function formatTime(time24: string, format: TimeFormat): string {
  if (!time24) return '';

  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeFromPreference(time24: string, preference?: TimeFormat): string {
  return formatTime(time24, preference || '12h');
}

export function decimalToTime(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatDecimalTime(decimal: number, format: TimeFormat): string {
  const time24 = decimalToTime(decimal);
  return formatTime(time24, format);
}

export function parseDecimalHours(input: string | number): number {
  if (typeof input === 'number') return input;

  const cleaned = input.trim();

  if (cleaned.includes(':')) {
    const [hours, minutes] = cleaned.split(':').map(s => parseInt(s));
    return hours + (minutes / 60);
  }

  return parseFloat(cleaned) || 0;
}

export function formatDecimalHours(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateHoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;

  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  let startTotal = startHours + startMinutes / 60;
  let endTotal = endHours + endMinutes / 60;

  if (endTotal < startTotal) {
    endTotal += 24;
  }

  return endTotal - startTotal;
}

export function timeToDecimal(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours + (minutes / 60);
}
