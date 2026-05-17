import { useEffect, useMemo, useState } from 'react';
import { DossierRow } from './DossierRow';
import { DossierSlider } from './DossierSlider';
import { VerdictBar, type Tone } from './VerdictBar';
import { lightFor, THRESHOLDS, type Light } from './thresholds';
import {
  DEFAULT_INITIAL_STATE,
  DEFAULT_VENUE,
  SAMPLE_VENUES,
  fmtPercent,
  fmtRent,
  fmtRentShort,
  type DossierStateKey,
  type DossierValues,
  type VenueKey,
} from './samplePresets';

interface LiveDossierCardProps {
  venueKey?: VenueKey;
  initialState?: DossierStateKey;
}

const RENT_SLIDER = { min: 0, max: 300_000, step: 1000 };
const PCT_SLIDER = { min: 0, max: 60, step: 0.5 };

type TouchedMap = Record<keyof DossierValues, boolean>;

function pctHintLt(value: number, touched: boolean, greenT: number, amberT: number): string {
  if (!touched) return 'awaiting slider';
  if (value < greenT) return `healthy · under ${greenT}%`;
  if (value < amberT) return `tight · over ${greenT}%`;
  return `red flag · over ${amberT}%`;
}

function rentHint(value: number, touched: boolean): string {
  if (!touched) return 'awaiting slider';
  const g = THRESHOLDS.rent.green;
  const a = THRESHOLDS.rent.amber;
  if (value < g) return `healthy · under ${fmtRentShort(g)}`;
  if (value < a) return `tight · over ${fmtRentShort(g)}`;
  return `red flag · over ${fmtRentShort(a)}`;
}

function netMarginHint(value: number, allTouched: boolean): string {
  if (!allTouched) return 'awaiting sliders';
  if (value > 10) return 'healthy · over 10%';
  if (value > 5) return 'tight · 5–10%';
  if (value > 0) return 'red flag · under 5%';
  return 'red flag · costs exceed sales';
}

function computeVerdict(opts: {
  allTouched: boolean;
  reds: number;
  ambers: number;
  netMargin: number;
}): { tone: Tone; label: string; sub: string } {
  const { allTouched, reds, ambers, netMargin } = opts;
  if (!allTouched) {
    return { tone: 'pending', label: 'Move the four sliders to see the verdict', sub: '— · —' };
  }
  if (netMargin <= 0) {
    return { tone: 'red', label: 'Walk away', sub: 'costs exceed sales' };
  }
  if (reds >= 2) {
    return { tone: 'red', label: 'Walk away', sub: `${reds} structural deal-breakers` };
  }
  if (reds === 1) {
    return { tone: 'red', label: 'One deal-breaker · re-cut it', sub: 'fix this before signing' };
  }
  if (ambers >= 2) {
    return { tone: 'amber', label: 'Viable — but tight', sub: `${ambers} margins running thin` };
  }
  if (ambers === 1) {
    return { tone: 'amber', label: 'Viable with one tight margin', sub: 'watch this line' };
  }
  return { tone: 'green', label: 'Viable', sub: 'on these ratios, the numbers stack' };
}

export function LiveDossierCard({
  venueKey = DEFAULT_VENUE,
  initialState = DEFAULT_INITIAL_STATE,
}: LiveDossierCardProps) {
  const venue = SAMPLE_VENUES[venueKey];

  const [vals, setVals] = useState<DossierValues>(() => ({ ...venue.preset[initialState] }));
  const [touched, setTouched] = useState<TouchedMap>(() => ({
    rent: initialState !== 'empty',
    cogs: initialState !== 'empty',
    labour: initialState !== 'empty',
    other: initialState !== 'empty',
  }));

  useEffect(() => {
    setVals({ ...SAMPLE_VENUES[venueKey].preset[initialState] });
    setTouched({
      rent: initialState !== 'empty',
      cogs: initialState !== 'empty',
      labour: initialState !== 'empty',
      other: initialState !== 'empty',
    });
  }, [venueKey, initialState]);

  const handleSlide = (k: keyof DossierValues) => (next: number) => {
    setVals((prev) => ({ ...prev, [k]: next }));
    setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
  };

  const anyTouched = touched.rent || touched.cogs || touched.labour || touched.other;
  const allTouched = touched.rent && touched.cogs && touched.labour && touched.other;
  const netMargin = 100 - vals.cogs - vals.labour - vals.other;

  const lights = useMemo(() => {
    const rent = lightFor(vals.rent, touched.rent, THRESHOLDS.rent);
    const cogs = lightFor(vals.cogs, touched.cogs, THRESHOLDS.cogs);
    const labour = lightFor(vals.labour, touched.labour, THRESHOLDS.labour);
    const other = lightFor(vals.other, touched.other, THRESHOLDS.other);
    const netMarginLight: Light = lightFor(
      netMargin,
      touched.cogs && touched.labour && touched.other,
      THRESHOLDS.netMargin,
    );
    return { rent, cogs, labour, other, netMargin: netMarginLight };
  }, [vals, touched, netMargin]);

  const reds = Object.values(lights).filter((l) => l === 'red').length;
  const ambers = Object.values(lights).filter((l) => l === 'amber').length;
  const verdict = computeVerdict({ allTouched, reds, ambers, netMargin });

  return (
    <div className="bg-[#0c0c0c] border border-viability-border rounded-tight shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden">
      {/* Header strip */}
      <div
        className="flex justify-between items-center px-[22px] py-[18px] border-b border-viability-border"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(52,211,153,0.04), rgba(52,211,153,0))',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 ${
              anyTouched
                ? 'bg-viability-green shadow-[0_0_0_4px_var(--vbr-green-soft)]'
                : 'bg-viability-fg-faint'
            }`}
            aria-hidden="true"
          />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-viability-fg-muted">
            Try it — live viability case
          </span>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-viability-fg-subtle">
          v1 · sample
        </span>
      </div>

      {/* Concept block */}
      <div className="px-[22px] pt-[22px] pb-2">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-viability-fg-subtle mb-1.5">
          Concept
        </div>
        <h3 className="font-display font-semibold text-[22px] tracking-[-0.015em] text-viability-cream m-0">
          {venue.label} · {venue.suburb}
        </h3>
        <div className="font-mono text-[11px] tracking-[0.04em] text-viability-fg-subtle mt-1.5">
          {venue.notes}
        </div>
      </div>

      {/* Sliders */}
      <div className="px-[22px] pt-[14px] pb-2 flex flex-col gap-[14px]">
        <DossierSlider
          label="Annual rent"
          help="base rent on the lease (ex outgoings)"
          value={vals.rent}
          touched={touched.rent}
          min={RENT_SLIDER.min}
          max={RENT_SLIDER.max}
          step={RENT_SLIDER.step}
          format={fmtRent}
          untouchedDisplay="$— · set this"
          onChange={handleSlide('rent')}
        />
        <DossierSlider
          label="Cost of goods · % of sales"
          help="food + drink inputs"
          value={vals.cogs}
          touched={touched.cogs}
          min={PCT_SLIDER.min}
          max={PCT_SLIDER.max}
          step={PCT_SLIDER.step}
          format={fmtPercent}
          untouchedDisplay="—% · set this"
          onChange={handleSlide('cogs')}
        />
        <DossierSlider
          label="Labour · % of sales"
          help="wages + super + on-costs"
          value={vals.labour}
          touched={touched.labour}
          min={PCT_SLIDER.min}
          max={PCT_SLIDER.max}
          step={PCT_SLIDER.step}
          format={fmtPercent}
          untouchedDisplay="—% · set this"
          onChange={handleSlide('labour')}
        />
        <DossierSlider
          label="Other costs · % of sales"
          help="utilities · insurance · marketing · everything else"
          value={vals.other}
          touched={touched.other}
          min={PCT_SLIDER.min}
          max={PCT_SLIDER.max}
          step={PCT_SLIDER.step}
          format={fmtPercent}
          untouchedDisplay="—% · set this"
          onChange={handleSlide('other')}
        />
      </div>

      {/* Output rows */}
      <div className="px-[22px] pt-[14px] pb-1.5 mt-1.5 border-t border-viability-border">
        <div className="font-mono uppercase tracking-[0.16em] text-viability-green text-[10.5px] mb-1">
          The verdict, line by line
        </div>
        <DossierRow
          label="Annual rent"
          display={touched.rent ? fmtRent(vals.rent) : '—'}
          hint={rentHint(vals.rent, touched.rent)}
          light={lights.rent}
        />
        <DossierRow
          label="Cost of goods"
          display={touched.cogs ? fmtPercent(vals.cogs) : '—'}
          hint={pctHintLt(vals.cogs, touched.cogs, THRESHOLDS.cogs.green, THRESHOLDS.cogs.amber)}
          light={lights.cogs}
        />
        <DossierRow
          label="Labour"
          display={touched.labour ? fmtPercent(vals.labour) : '—'}
          hint={pctHintLt(vals.labour, touched.labour, THRESHOLDS.labour.green, THRESHOLDS.labour.amber)}
          light={lights.labour}
        />
        <DossierRow
          label="Other costs"
          display={touched.other ? fmtPercent(vals.other) : '—'}
          hint={pctHintLt(vals.other, touched.other, THRESHOLDS.other.green, THRESHOLDS.other.amber)}
          light={lights.other}
        />
        <DossierRow
          label={
            <span>
              <span className="text-viability-cream">Net margin</span>{' '}
              <span className="text-viability-fg-subtle">· what’s left over</span>
            </span>
          }
          display={allTouched ? fmtPercent(netMargin) : '—'}
          hint={netMarginHint(netMargin, allTouched)}
          light={lights.netMargin}
          emphasised
        />
      </div>

      <VerdictBar tone={verdict.tone} label={verdict.label} sub={verdict.sub} />
    </div>
  );
}
