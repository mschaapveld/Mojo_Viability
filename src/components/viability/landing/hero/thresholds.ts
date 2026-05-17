export type Light = 'pending' | 'green' | 'amber' | 'red';

export interface RowThresholds {
  green: number;
  amber: number;
  direction: 'lt' | 'gt';
}

export const THRESHOLDS = {
  rent:      { green: 80_000, amber: 150_000, direction: 'lt' },
  cogs:      { green: 32,     amber: 36,      direction: 'lt' },
  labour:    { green: 30,     amber: 36,      direction: 'lt' },
  other:     { green: 20,     amber: 25,      direction: 'lt' },
  netMargin: { green: 10,     amber: 5,       direction: 'gt' },
} as const satisfies Record<string, RowThresholds>;

export function lightFor(value: number, touched: boolean, t: RowThresholds): Light {
  if (!touched) return 'pending';
  if (t.direction === 'lt') {
    if (value < t.green) return 'green';
    if (value < t.amber) return 'amber';
    return 'red';
  }
  if (value > t.green) return 'green';
  if (value > t.amber) return 'amber';
  return 'red';
}
