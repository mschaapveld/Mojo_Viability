export type VenueKey = 'cafe' | 'winebar' | 'pub';
export type DossierStateKey = 'empty' | 'mid' | 'complete';

export interface DossierValues {
  rent: number;
  cogs: number;
  labour: number;
  other: number;
}

export interface VenuePreset {
  key: VenueKey;
  label: string;
  suburb: string;
  notes: string;
  preset: Record<DossierStateKey, DossierValues>;
}

const EMPTY_VALUES: DossierValues = { rent: 0, cogs: 0, labour: 0, other: 0 };

export const SAMPLE_VENUES: Record<VenueKey, VenuePreset> = {
  cafe: {
    key: 'cafe',
    label: '40-seat café',
    suburb: 'Brunswick East · Melbourne',
    notes: '7-day trade · breakfast + lunch · $24 avg check',
    preset: {
      empty: EMPTY_VALUES,
      mid:      { rent: 110_000, cogs: 38, labour: 34, other: 18 },
      complete: { rent:  56_000, cogs: 32, labour: 30, other: 16 },
    },
  },
  winebar: {
    key: 'winebar',
    label: '32-seat wine bar',
    suburb: 'Surry Hills · Sydney',
    notes: '5-day trade · evenings only · $58 avg check',
    preset: {
      empty: EMPTY_VALUES,
      mid:      { rent: 175_000, cogs: 40, labour: 30, other: 20 },
      complete: { rent:  92_000, cogs: 34, labour: 26, other: 18 },
    },
  },
  pub: {
    key: 'pub',
    label: 'regional pub',
    suburb: 'Bendigo · VIC',
    notes: '7-day trade · meals + bar · $38 avg check',
    preset: {
      empty: EMPTY_VALUES,
      mid:      { rent: 160_000, cogs: 36, labour: 36, other: 22 },
      complete: { rent:  92_000, cogs: 32, labour: 30, other: 20 },
    },
  },
};

export const DEFAULT_VENUE: VenueKey = 'cafe';
export const DEFAULT_INITIAL_STATE: DossierStateKey = 'empty';

export function fmtRent(v: number): string {
  return `$${v.toLocaleString()}`;
}

export function fmtRentShort(v: number): string {
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

export function fmtPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}
