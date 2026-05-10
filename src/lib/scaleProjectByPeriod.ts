import type {
  CustomFixedCost,
  DetailedBreakEvenScenario,
  Period,
  ProjectData,
} from '@/lib/types/projectTypes';

// Per anatomy §3.2 (L681–716): scales numeric fields in simpleBreakEven +
// detailedBreakEven when the user changes period. Fields whose names
// contain 'variable', 'percent'/'Percent', 'Interest', or 'Term' are
// excluded — those represent ratios or annualised parameters that don't
// scale with display period.
//
// Note on customFixedCosts: legacy mojo_business `scaleData` only iterated
// top-level numeric properties, so user-added custom fixed costs (an
// array of {id, name, value} objects) silently failed to scale. We scale
// them explicitly here to close that gap.

const PERIOD_MULTIPLIERS: Record<Period, number> = {
  Weekly: 1,
  Monthly: 4.33,
  Yearly: 52,
};

const SCALING_EXCLUDED_SUBSTRINGS = ['variable', 'percent', 'Percent', 'Interest', 'Term'];

function shouldScale(key: string): boolean {
  return !SCALING_EXCLUDED_SUBSTRINGS.some((sub) => key.includes(sub));
}

function scaleNumericFields<T>(data: T, scaleFactor: number): T {
  const scaled: Record<string, unknown> = { ...(data as object) };
  for (const key of Object.keys(scaled)) {
    const value = scaled[key];
    if (typeof value === 'number' && shouldScale(key)) {
      scaled[key] = value * scaleFactor;
    }
  }
  return scaled as T;
}

function scaleCustomFixedCosts(
  costs: CustomFixedCost[] | undefined,
  scaleFactor: number,
): CustomFixedCost[] | undefined {
  if (!costs) return costs;
  return costs.map((c) => ({ ...c, value: c.value * scaleFactor }));
}

function scaleDetailedScenario(
  scenario: DetailedBreakEvenScenario,
  scaleFactor: number,
): DetailedBreakEvenScenario {
  const scaled = scaleNumericFields(scenario, scaleFactor);
  scaled.customFixedCosts = scaleCustomFixedCosts(scenario.customFixedCosts, scaleFactor) ?? [];
  return scaled;
}

export function scaleProjectByPeriod(prev: ProjectData, newPeriod: Period): ProjectData {
  const oldPeriod = prev.period;
  if (oldPeriod === newPeriod) return prev;

  const scaleFactor = PERIOD_MULTIPLIERS[newPeriod] / PERIOD_MULTIPLIERS[oldPeriod];

  return {
    ...prev,
    period: newPeriod,
    simpleBreakEven: scaleNumericFields(prev.simpleBreakEven, scaleFactor),
    detailedBreakEven: {
      scenario1: scaleDetailedScenario(prev.detailedBreakEven.scenario1, scaleFactor),
      scenario2: scaleDetailedScenario(prev.detailedBreakEven.scenario2, scaleFactor),
      scenario3: scaleDetailedScenario(prev.detailedBreakEven.scenario3, scaleFactor),
    },
  };
}
