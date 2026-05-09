import { ProjectData, DetailedBreakEvenScenario } from './types/projectTypes';

export const WALKTHROUGH_STEPS = {
  SIMPLE_BREAK_EVEN: 1,
  BUSINESS_PLAN_BUILDER: 2,
  FITOUT_FINANCING: 3,
  DETAILED_BREAK_EVEN: 4,
  HOURS_OF_OPERATION: 5,
  LABOUR_COSTING: 6,
  SALES_BREAKUP: 7,
  MENU_BUILDER: 8,
  LOCATION_SUITABILITY: 9,
  SALES_PREDICTIONS: 10,
  AI_BUSINESS_PLAN: 11,
} as const;

export const STEP_NAMES: Record<number, string> = {
  1: 'Simple Break-Even',
  2: 'Business Plan Builder',
  3: 'Fitout & Financing',
  4: 'Detailed Break-Even',
  5: 'Hours of Operation',
  6: 'Labour Costing',
  7: 'Sales Breakup',
  8: 'Menu Builder',
  9: 'Location Suitability',
  10: 'Sales Predictions',
  11: 'AI Business Plan',
};

export const STEP_ROUTES: Record<number, string> = {
  1: '/simple-break-even',
  2: '/business-plan-builder',
  3: '/fitout-financing',
  4: '/detailed-break-even',
  5: '/hours-of-operation',
  6: '/labour-costing',
  7: '/sales-breakup',
  8: '/menu-builder',
  9: '/location-suitability',
  10: '/sales-predictions',
  11: '/ai-business-plan',
};

function isSimpleBreakEvenReady(project: ProjectData): boolean {
  const simple = project.simpleBreakEven;
  return simple.enteredSales > 0 && simple.rent > 0;
}

function isBusinessPlanBuilderReady(project: ProjectData): boolean {
  return !!(project.businessOrigin && project.scenarioMode);
}

function isFitoutFinancingReady(project: ProjectData): boolean {
  const scenario = project.fitoutFinancing?.scenario1;
  if (!scenario) return false;

  const hasStartupCapital = scenario.startupCapital > 0;
  const hasBasicCosts = scenario.equipment >= 0 && scenario.stock >= 0;

  return hasStartupCapital && hasBasicCosts;
}

function isDetailedBreakEvenReady(_project: ProjectData, activeScenario?: DetailedBreakEvenScenario | null): boolean {
  if (!activeScenario) return false;

  const hasValidSales = activeScenario.enteredSales > 0;
  const hasFixedCosts = activeScenario.rent >= 0 && activeScenario.labourMinimumCost >= 0;
  const hasVariableCosts = activeScenario.variableCogs >= 0;

  return hasValidSales && hasFixedCosts && hasVariableCosts;
}

function isHoursOfOperationReady(project: ProjectData): boolean {
  if (!project.hoursOfOperation) return false;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const hasAtLeastOneDayOpen = days.some(day => project.hoursOfOperation[day]?.open);

  return hasAtLeastOneDayOpen;
}

function isLabourCostingReady(project: ProjectData): boolean {
  if (!project.labourCosting) return false;

  const hasStaffRoles = project.labourCosting.staffRoles && project.labourCosting.staffRoles.length > 0;
  const hasValidStaff = project.labourCosting.staffRoles?.some(role =>
    role.hoursPerWeek > 0 && role.hourlyRate > 0
  );

  return !!(hasStaffRoles && hasValidStaff);
}

function isSalesBreakupReady(project: ProjectData): boolean {
  if (!project.salesBreakup) return false;

  const hasWeeklySales = project.salesBreakup.weeklySales > 0;
  const hasDayPercentages = project.salesBreakup.dayPercentages &&
    Object.values(project.salesBreakup.dayPercentages).some(p => p > 0);

  return hasWeeklySales && !!hasDayPercentages;
}

function isMenuBuilderReady(project: ProjectData): boolean {
  // Menu Builder is optional, so it's ready if it has any data or if skipped
  if (!project.menuData) return false;
  return project.menuData.items.length > 0 || project.menuData.majorCategories.length > 0;
}

function isLocationSuitabilityReady(project: ProjectData): boolean {
  return !!(project.location?.address);
}

function isSalesPredictionsReady(project: ProjectData, activeScenario?: DetailedBreakEvenScenario | null): boolean {
  return isDetailedBreakEvenReady(project, activeScenario);
}

function isAIBusinessPlanReady(project: ProjectData, activeScenario?: DetailedBreakEvenScenario | null): boolean {
  return isDetailedBreakEvenReady(project, activeScenario);
}

export interface StepMetadata {
  stepNumber: number;
  stepName: string;
  route: string;
  isOptional: boolean;
  isReady: (project: ProjectData, activeScenario?: DetailedBreakEvenScenario | null) => boolean;
}

export const STEP_METADATA: StepMetadata[] = [
  {
    stepNumber: 1,
    stepName: 'Simple Break-Even',
    route: '/simple-break-even',
    isOptional: true,
    isReady: isSimpleBreakEvenReady,
  },
  {
    stepNumber: 2,
    stepName: 'Business Plan Builder',
    route: '/business-plan-builder',
    isOptional: false,
    isReady: isBusinessPlanBuilderReady,
  },
  {
    stepNumber: 3,
    stepName: 'Fitout & Financing',
    route: '/fitout-financing',
    isOptional: false,
    isReady: isFitoutFinancingReady,
  },
  {
    stepNumber: 4,
    stepName: 'Detailed Break-Even',
    route: '/detailed-break-even',
    isOptional: false,
    isReady: isDetailedBreakEvenReady,
  },
  {
    stepNumber: 5,
    stepName: 'Hours of Operation',
    route: '/hours-of-operation',
    isOptional: false,
    isReady: isHoursOfOperationReady,
  },
  {
    stepNumber: 6,
    stepName: 'Labour Costing',
    route: '/labour-costing',
    isOptional: false,
    isReady: isLabourCostingReady,
  },
  {
    stepNumber: 7,
    stepName: 'Sales Breakup',
    route: '/sales-breakup',
    isOptional: false,
    isReady: isSalesBreakupReady,
  },
  {
    stepNumber: 8,
    stepName: 'Menu Builder',
    route: '/menu-builder',
    isOptional: true,
    isReady: isMenuBuilderReady,
  },
  {
    stepNumber: 9,
    stepName: 'Location Suitability',
    route: '/location-suitability',
    isOptional: false,
    isReady: isLocationSuitabilityReady,
  },
  {
    stepNumber: 10,
    stepName: 'Sales Predictions',
    route: '/sales-predictions',
    isOptional: false,
    isReady: isSalesPredictionsReady,
  },
  {
    stepNumber: 11,
    stepName: 'AI Business Plan',
    route: '/ai-business-plan',
    isOptional: false,
    isReady: isAIBusinessPlanReady,
  },
];

export function getActiveScenario(project: ProjectData): DetailedBreakEvenScenario | null {
  if (!project.detailedBreakEven) return null;

  const selectedScenario = project.selectedScenario || 1;

  switch (selectedScenario) {
    case 1:
      return project.detailedBreakEven.scenario1;
    case 2:
      return project.detailedBreakEven.scenario2;
    case 3:
      return project.detailedBreakEven.scenario3;
    default:
      return project.detailedBreakEven.scenario1;
  }
}

export function getNextRequiredStep(project: ProjectData, currentStepNumber?: number): StepMetadata | null {
  const activeScenario = getActiveScenario(project);

  if (currentStepNumber) {
    for (const step of STEP_METADATA) {
      if (step.stepNumber >= currentStepNumber) break;
      if (step.isOptional) continue;

      if (!step.isReady(project, activeScenario)) {
        return step;
      }
    }

    if (currentStepNumber < 11) {
      const nextStep = STEP_METADATA.find(s => s.stepNumber === currentStepNumber + 1);
      if (nextStep) return nextStep;
    }

    if (currentStepNumber === 11) {
      return STEP_METADATA[STEP_METADATA.length - 1];
    }
  }

  for (const step of STEP_METADATA) {
    if (step.isOptional) continue;

    if (!step.isReady(project, activeScenario)) {
      return step;
    }
  }

  return STEP_METADATA[STEP_METADATA.length - 1];
}

export function getStepMetadata(stepNumber: number): StepMetadata | undefined {
  return STEP_METADATA.find(s => s.stepNumber === stepNumber);
}

export function isStepComplete(project: ProjectData, stepNumber: number): boolean {
  const step = getStepMetadata(stepNumber);
  if (!step) return false;

  if (step.isOptional) {
    return project.stepStatus?.[stepNumber] === 'complete';
  }

  const activeScenario = getActiveScenario(project);
  return step.isReady(project, activeScenario);
}

export function markStepComplete(project: ProjectData, step: number): Partial<ProjectData> {
  return {
    walkthroughStep: step + 1,
    stepStatus: {
      ...project.stepStatus,
      [step]: 'complete',
    },
  };
}

export function markStepSkipped(project: ProjectData, step: number): Partial<ProjectData> {
  return {
    walkthroughStep: step + 1,
    stepStatus: {
      ...project.stepStatus,
      [step]: 'skipped',
    },
  };
}

export function markStepFailed(project: ProjectData, step: number): Partial<ProjectData> {
  return {
    walkthroughStep: -1,
    stepStatus: {
      ...project.stepStatus,
      [step]: 'fail',
    },
  };
}

export function canAccessStep(project: ProjectData, step: number): boolean {
  if (!project.walkthroughStep) return step === 1;

  if (project.walkthroughStep === -1) {
    return step === 1;
  }

  return project.walkthroughStep >= step;
}

export function getCurrentStep(project: ProjectData): number {
  return project.walkthroughStep || 1;
}

export function getStepStatus(project: ProjectData, step: number): 'complete' | 'skipped' | 'fail' | 'pending' {
  if (!project.stepStatus || !project.stepStatus[step]) {
    return 'pending';
  }
  return project.stepStatus[step];
}

export function addReferralFlag(project: ProjectData, flag: string): Partial<ProjectData> {
  const currentFlags = project.referralFlags || {};
  return {
    referralFlags: {
      ...currentFlags,
      [flag]: (currentFlags[flag] || 0) + 1,
    },
  };
}

export function getNextStepRoute(project: ProjectData): string {
  const currentStep = getCurrentStep(project);

  if (currentStep === -1) {
    return STEP_ROUTES[1];
  }

  if (currentStep > 11) {
    return STEP_ROUTES[11];
  }

  return STEP_ROUTES[currentStep];
}

export function shouldShowReferrals(project: ProjectData): boolean {
  return project.walkthroughStep === -1 || project.walkthroughStep === 11;
}
