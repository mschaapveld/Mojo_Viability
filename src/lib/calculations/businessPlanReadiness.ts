import { ProjectData, DetailedBreakEvenScenario } from '@/lib/types/projectTypes';

export interface ReadinessItem {
  key: string;
  label: string;
  isComplete: boolean;
  isRequired: boolean;
  stepLink?: number;
}

export interface BusinessPlanReadiness {
  canGeneratePlan: boolean;
  completionPercent: number;
  requiredItems: ReadinessItem[];
  optionalItems: ReadinessItem[];
  blockers: string[];
}

function isDetailedBreakEvenUsable(scenario: DetailedBreakEvenScenario): boolean {
  const hasRent = scenario.rent > 0;
  const hasSales = scenario.enteredSales > 0;
  const hasVariables = scenario.variableCogs > 0 || scenario.variableLabour > 0;
  return hasRent && hasSales && hasVariables;
}

export function checkBusinessPlanReadiness(
  project: ProjectData,
  activeScenario: 'scenario1' | 'scenario2' | 'scenario3' = 'scenario1'
): BusinessPlanReadiness {
  const requiredItems: ReadinessItem[] = [];
  const optionalItems: ReadinessItem[] = [];
  const blockers: string[] = [];

  const scenario = project.detailedBreakEven[activeScenario];
  const detailedBreakEvenUsable = isDetailedBreakEvenUsable(scenario);

  requiredItems.push({
    key: 'detailedBreakEven',
    label: 'Detailed Break-Even Analysis',
    isComplete: detailedBreakEvenUsable,
    isRequired: true,
    stepLink: 4,
  });

  if (!detailedBreakEvenUsable) {
    blockers.push('Complete the Detailed Break-Even Analysis to generate your business plan. This provides the financial foundation for your plan.');
  }

  const hasAddress = !!project.siteAddress || !!project.location?.address;
  requiredItems.push({
    key: 'siteAddress',
    label: 'Site Address',
    isComplete: hasAddress,
    isRequired: true,
    stepLink: 1,
  });

  if (!hasAddress) {
    blockers.push('Enter a site address to include location details in your business plan.');
  }

  const hasVenueType = !!scenario.venueType;
  requiredItems.push({
    key: 'venueType',
    label: 'Venue Type',
    isComplete: hasVenueType,
    isRequired: true,
  });

  if (!hasVenueType) {
    blockers.push('Select a venue type to classify your business for the business plan.');
  }

  const hasBusinessName = !!project.siteName || !!project.businessPlan?.brandName;
  optionalItems.push({
    key: 'businessName',
    label: 'Business/Brand Name',
    isComplete: hasBusinessName,
    isRequired: false,
  });

  const hasBusinessCategory = !!project.businessPlan?.businessCategory;
  optionalItems.push({
    key: 'businessCategory',
    label: 'Business Category',
    isComplete: hasBusinessCategory,
    isRequired: false,
  });

  const hasHoursOfOperation = Object.values(project.hoursOfOperation).some(day => day.open);
  optionalItems.push({
    key: 'hoursOfOperation',
    label: 'Hours of Operation',
    isComplete: hasHoursOfOperation,
    isRequired: false,
    stepLink: 2,
  });

  const hasLabourCosting = !!project.labourCosting && project.labourCosting.staffRoles.length > 0;
  optionalItems.push({
    key: 'labourCosting',
    label: 'Labour Costing',
    isComplete: hasLabourCosting,
    isRequired: false,
    stepLink: 5,
  });

  const fitoutScenario = project.fitoutFinancing[activeScenario];
  const hasFitoutFinancing = fitoutScenario.startupCapital > 0 || fitoutScenario.loanAmount > 0;
  optionalItems.push({
    key: 'fitoutFinancing',
    label: 'Fitout & Financing',
    isComplete: hasFitoutFinancing,
    isRequired: false,
    stepLink: 6,
  });

  const locationFields = project.location;
  const hasLocationSuitability = !!(
    locationFields?.frontageType ||
    locationFields?.parkingQuality ||
    locationFields?.visibility ||
    locationFields?.nearbyActivity ||
    locationFields?.catchmentStrength
  );
  optionalItems.push({
    key: 'locationSuitability',
    label: 'Location Suitability',
    isComplete: hasLocationSuitability,
    isRequired: false,
    stepLink: 7,
  });

  const allRequiredComplete = requiredItems.every(item => item.isComplete);
  const canGeneratePlan = allRequiredComplete;

  const totalItems = requiredItems.length + optionalItems.length;
  const completedItems = [...requiredItems, ...optionalItems].filter(item => item.isComplete).length;
  const completionPercent = Math.round((completedItems / totalItems) * 100);

  return {
    canGeneratePlan,
    completionPercent,
    requiredItems,
    optionalItems,
    blockers,
  };
}

export function getScenarioLabel(scenario: 'scenario1' | 'scenario2' | 'scenario3'): string {
  switch (scenario) {
    case 'scenario1': return 'Scenario 1';
    case 'scenario2': return 'Scenario 2';
    case 'scenario3': return 'Scenario 3';
  }
}
