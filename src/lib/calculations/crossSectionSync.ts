import type {
  ProjectData,
  DetailedBreakEvenScenario,
  FitoutFinancingScenario,
} from '@/lib/types/projectTypes';

// Per anatomy §3.2 / §6.1: when the user flips occupancyType in one slice
// (renting vs purchasing), copy the property fields across so the two
// slices don't diverge. The `if occupancyType differs` guard prevents
// infinite-loop coupling — once the modes match, no further sync fires
// regardless of subsequent property-field edits.

type ScenarioKey = 'scenario1' | 'scenario2' | 'scenario3';
const SCENARIO_KEYS: ScenarioKey[] = ['scenario1', 'scenario2', 'scenario3'];

function syncFitoutToDetailed(
  fitout: ProjectData['fitoutFinancing'],
  prevDetailed: ProjectData['detailedBreakEven'],
): ProjectData['detailedBreakEven'] {
  const next = { ...prevDetailed };
  for (const key of SCENARIO_KEYS) {
    const fitoutScenario = fitout[key];
    const detailedScenario = prevDetailed[key];
    if (fitoutScenario.occupancyType !== detailedScenario.occupancyType) {
      const synced: DetailedBreakEvenScenario = {
        ...detailedScenario,
        occupancyType: fitoutScenario.occupancyType,
        loanType:
          fitoutScenario.occupancyType === 'purchasing'
            ? detailedScenario.loanType ?? 'principalAndInterest'
            : detailedScenario.loanType,
        propertyPurchasePrice: fitoutScenario.propertyPurchasePrice,
        propertyDeposit: fitoutScenario.propertyDeposit,
        propertyClosingCosts: fitoutScenario.propertyClosingCosts,
        propertyStampDuty: fitoutScenario.propertyStampDuty,
        propertyGstPayable: fitoutScenario.propertyGstPayable,
        propertyInterestRate: fitoutScenario.propertyInterestRate,
        propertyLoanTerm: fitoutScenario.propertyLoanTerm,
      };
      next[key] = synced;
    }
  }
  return next;
}

function syncDetailedToFitout(
  detailed: ProjectData['detailedBreakEven'],
  prevFitout: ProjectData['fitoutFinancing'],
): ProjectData['fitoutFinancing'] {
  const next = { ...prevFitout };
  for (const key of SCENARIO_KEYS) {
    const detailedScenario = detailed[key];
    const fitoutScenario = prevFitout[key];
    if (detailedScenario.occupancyType !== fitoutScenario.occupancyType) {
      // Asymmetric: loanType is fitout-side concern, not synced back from detailed.
      const synced: FitoutFinancingScenario = {
        ...fitoutScenario,
        occupancyType: detailedScenario.occupancyType,
        propertyPurchasePrice: detailedScenario.propertyPurchasePrice,
        propertyDeposit: detailedScenario.propertyDeposit,
        propertyClosingCosts: detailedScenario.propertyClosingCosts,
        propertyStampDuty: detailedScenario.propertyStampDuty,
        propertyGstPayable: detailedScenario.propertyGstPayable,
        propertyInterestRate: detailedScenario.propertyInterestRate,
        propertyLoanTerm: detailedScenario.propertyLoanTerm,
      };
      next[key] = synced;
    }
  }
  return next;
}

export function applyCrossSectionSync(
  prev: ProjectData,
  updates: Partial<ProjectData>,
): ProjectData {
  const merged: ProjectData = { ...prev, ...updates };
  if (updates.fitoutFinancing) {
    merged.detailedBreakEven = syncFitoutToDetailed(
      merged.fitoutFinancing,
      prev.detailedBreakEven,
    );
  }
  if (updates.detailedBreakEven) {
    merged.fitoutFinancing = syncDetailedToFitout(
      merged.detailedBreakEven,
      prev.fitoutFinancing,
    );
  }
  return merged;
}
