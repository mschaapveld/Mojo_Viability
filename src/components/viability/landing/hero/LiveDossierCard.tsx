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
  type DossierStateKey,
  type DossierValues,
  type VenueKey,
} from './samplePresets';

interface LiveDossierCardProps {
  venueKey?: VenueKey;
  initialState?: DossierStateKey;
}

const SALES_SLIDER = { min: 0, max: 2_000_000, step: 5_000 };
const RENT_SLIDER  = { min: 0, max: 300_000,   step: 1_000 };
const PCT_SLIDER   = { min: 0, max: 60,        step: 0.5 };

type TouchedMap = Record<keyof DossierValues, boolean>;

function verdictWord(light: Light): string {
  switch (light) {
    case 'green':   return 'healthy';
    case 'amber':   return 'tight';
    case 'red':     return 'red flag';
    case 'pending': return 'awaiting slider';
  }
}

// Negative-aware money formatter. Uses U+2212 minus sign for negative values
// so net margin reads "−$90,000" rather than "-$90,000".
function fmtMoney(n: number): string {
  const rounded = Math.round(n);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? '−' : '';
  return `${sign}$${abs.toLocaleString('en-AU')}`;
}

function computeVerdict(opts: {
  allTouched: boolean;
  reds: number;
  ambers: number;
  netMargin: number;
}): { tone: Tone; label: string; sub: string } {
  const { allTouched, reds, ambers, netMargin } = opts;
  if (!allTouched) {
    return { tone: 'pending', label: 'Move the five sliders to see the verdict', sub: '— · —' };
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
    sales:  initialState !== 'empty',
    rent:   initialState !== 'empty',
    cogs:   initialState !== 'empty',
    labour: initialState !== 'empty',
    other:  initialState !== 'empty',
  }));

  useEffect(() => {
    setVals({ ...SAMPLE_VENUES[venueKey].preset[initialState] });
    setTouched({
      sales:  initialState !== 'empty',
      rent:   initialState !== 'empty',
      cogs:   initialState !== 'empty',
      labour: initialState !== 'empty',
      other:  initialState !== 'empty',
    });
  }, [venueKey, initialState]);

  const handleSlide = (k: keyof DossierValues) => (next: number) => {
    setVals((prev) => ({ ...prev, [k]: next }));
    setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
  };

  const anyTouched =
    touched.sales || touched.rent || touched.cogs || touched.labour || touched.other;
  const allTouched =
    touched.sales && touched.rent && touched.cogs && touched.labour && touched.other;

  // Dollar derivations
  const rentDollar      = vals.rent;
  const cogsDollar      = vals.sales * (vals.cogs   / 100);
  const labourDollar    = vals.sales * (vals.labour / 100);
  const otherDollar     = vals.sales * (vals.other  / 100);
  const netMarginDollar = vals.sales - rentDollar - cogsDollar - labourDollar - otherDollar;

  // Percentage-of-sales (used for threshold evaluation + hint copy)
  const rentPct      = vals.sales > 0 ? (vals.rent / vals.sales) * 100 : 0;
  const cogsPct      = vals.cogs;
  const labourPct    = vals.labour;
  const otherPct     = vals.other;
  const netMarginPct = vals.sales > 0 ? (netMarginDollar / vals.sales) * 100 : 0;

  // Per-row touched conditions — every row depends on sales being touched
  // (because every derived value is denominated in / against sales)
  const rentRowTouched      = touched.sales && touched.rent;
  const cogsRowTouched      = touched.sales && touched.cogs;
  const labourRowTouched    = touched.sales && touched.labour;
  const otherRowTouched     = touched.sales && touched.other;
  const netMarginRowTouched = allTouched;

  const lights = useMemo(() => ({
    rent:      lightFor(rentPct,      rentRowTouched,      THRESHOLDS.rent),
    cogs:      lightFor(cogsPct,      cogsRowTouched,      THRESHOLDS.cogs),
    labour:    lightFor(labourPct,    labourRowTouched,    THRESHOLDS.labour),
    other:     lightFor(otherPct,     otherRowTouched,     THRESHOLDS.other),
    netMargin: lightFor(netMarginPct, netMarginRowTouched, THRESHOLDS.netMargin),
  }), [rentPct, cogsPct, labourPct, otherPct, netMarginPct,
       rentRowTouched, cogsRowTouched, labourRowTouched, otherRowTouched, netMarginRowTouched]);

  const lightsArr: Light[] = [lights.rent, lights.cogs, lights.labour, lights.other, lights.netMargin];
  const reds   = lightsArr.filter((l) => l === 'red').length;
  const ambers = lightsArr.filter((l) => l === 'amber').length;
  const verdict = computeVerdict({ allTouched, reds, ambers, netMargin: netMarginDollar });

  // Per-row hint copy
  const rentHint = !touched.sales
    ? 'awaiting annual sales'
    : !touched.rent
      ? 'awaiting slider'
      : `${verdictWord(lights.rent)} · ${rentPct.toFixed(1)}% of sales`;

  const cogsHint = !touched.sales
    ? 'awaiting annual sales'
    : !touched.cogs
      ? 'awaiting slider'
      : `${verdictWord(lights.cogs)} · ${cogsPct.toFixed(1)}% of sales`;

  const labourHint = !touched.sales
    ? 'awaiting annual sales'
    : !touched.labour
      ? 'awaiting slider'
      : `${verdictWord(lights.labour)} · ${labourPct.toFixed(1)}% of sales`;

  const otherHint = !touched.sales
    ? 'awaiting annual sales'
    : !touched.other
      ? 'awaiting slider'
      : `${verdictWord(lights.other)} · ${otherPct.toFixed(1)}% of sales`;

  const netMarginHint = !netMarginRowTouched
    ? 'awaiting all sliders'
    : netMarginDollar < 0
      ? 'costs exceed sales'
      : `${verdictWord(lights.netMargin)} · ${netMarginPct.toFixed(1)}% of sales`;

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
          label="Annual sales"
          help="the realistic annual revenue you expect"
          value={vals.sales}
          touched={touched.sales}
          min={SALES_SLIDER.min}
          max={SALES_SLIDER.max}
          step={SALES_SLIDER.step}
          format={fmtRent}
          untouchedDisplay="$— · set this"
          onChange={handleSlide('sales')}
        />
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
          display={rentRowTouched ? fmtMoney(rentDollar) : '$—'}
          hint={rentHint}
          light={lights.rent}
        />
        <DossierRow
          label="Cost of goods"
          display={cogsRowTouched ? fmtMoney(cogsDollar) : '$—'}
          hint={cogsHint}
          light={lights.cogs}
        />
        <DossierRow
          label="Labour"
          display={labourRowTouched ? fmtMoney(labourDollar) : '$—'}
          hint={labourHint}
          light={lights.labour}
        />
        <DossierRow
          label="Other costs"
          display={otherRowTouched ? fmtMoney(otherDollar) : '$—'}
          hint={otherHint}
          light={lights.other}
        />
        <DossierRow
          label={
            <span>
              <span className="text-viability-cream">Net margin</span>{' '}
              <span className="text-viability-fg-subtle">· what’s left over</span>
            </span>
          }
          display={netMarginRowTouched ? fmtMoney(netMarginDollar) : '$—'}
          hint={netMarginHint}
          light={lights.netMargin}
          emphasised
        />
      </div>

      <VerdictBar tone={verdict.tone} label={verdict.label} sub={verdict.sub} />
    </div>
  );
}
