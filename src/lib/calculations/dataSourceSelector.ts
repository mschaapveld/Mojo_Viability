import { ProjectData } from "../types/projectTypes";

export type DataSource = "detailed" | "simple" | "none";

export interface DataSourceInfo {
  source: DataSource;
  isAssumptionHeavy: boolean;
  reason: string;
}

/**
 * Determines which data source (Detailed or Simple Break-Even) should be used
 * for Business Snapshot calculations, following the Progressive Accuracy Model.
 *
 * Priority: Detailed Break-Even (Step 3) > Simple Break-Even (Step 1)
 */
export function selectDataSource(project: ProjectData): DataSourceInfo {
  const simple = project.simpleBreakEven;
  const detailed = project.detailedBreakEven.scenario1;

  // Check if Simple has usable data
  const simpleHasData =
    simple.enteredSales > 0 &&
    simple.rent > 0 &&
    (simple.variableCogs > 0 || simple.variableLabour > 0 || simple.variableOther > 0);

  // Check if Detailed has usable data
  const detailedHasData =
    detailed.enteredSales > 0 &&
    (detailed.rent > 0 || detailed.labourMinimumCost > 0) &&
    (detailed.variableCogs > 0 || detailed.variableLabour > 0 || detailed.variableOther > 0);

  // If neither has data, return none
  if (!simpleHasData && !detailedHasData) {
    return {
      source: "none",
      isAssumptionHeavy: false,
      reason: "No break-even data available"
    };
  }

  // If only Simple has data, use Simple
  if (simpleHasData && !detailedHasData) {
    return {
      source: "simple",
      isAssumptionHeavy: false,
      reason: "Using Simple Break-Even"
    };
  }

  // If only Detailed has data, use Detailed
  if (detailedHasData && !simpleHasData) {
    return {
      source: "detailed",
      isAssumptionHeavy: false,
      reason: "Using Detailed Break-Even"
    };
  }

  // Both have data - determine which is more complete
  // Detailed is preferred if it has advanced features or more data
  const detailedScore = calculateDetailedScore(detailed);
  const simpleScore = calculateSimpleScore(simple);

  // Always prefer Detailed if it has advanced features
  const hasAdvancedFeatures =
    (detailed.customFixedCosts && detailed.customFixedCosts.length > 0) ||
    detailed.rentTurnoverEnabled ||
    detailed.isFranchise ||
    detailed.insurance > 0 ||
    detailed.accounting > 0 ||
    detailed.marketing > 0 ||
    detailed.utilities > 0 ||
    detailed.otherFixed > 0;

  if (hasAdvancedFeatures) {
    return {
      source: "detailed",
      isAssumptionHeavy: false,
      reason: "Using Detailed Break-Even (more granular data)"
    };
  }

  // Otherwise compare completeness scores
  if (detailedScore >= simpleScore) {
    return {
      source: "detailed",
      isAssumptionHeavy: detailedScore < 5,
      reason: "Using Detailed Break-Even"
    };
  } else {
    return {
      source: "simple",
      isAssumptionHeavy: simpleScore < 4,
      reason: "Using Simple Break-Even"
    };
  }
}

/**
 * Calculate a completeness score for Detailed Break-Even
 */
function calculateDetailedScore(detailed: any): number {
  let score = 0;

  if (detailed.enteredSales > 0) score++;
  if (detailed.ownersReturn > 0) score++;
  if (detailed.rent > 0) score++;
  if (detailed.labourMinimumCost > 0) score++;
  if (detailed.variableCogs > 0) score++;
  if (detailed.variableLabour > 0) score++;
  if (detailed.variableOther > 0) score++;
  if (detailed.customFixedCosts && detailed.customFixedCosts.length > 0) score += detailed.customFixedCosts.length;
  if (detailed.insurance > 0) score++;
  if (detailed.accounting > 0) score++;
  if (detailed.marketing > 0) score++;
  if (detailed.utilities > 0) score++;
  if (detailed.otherFixed > 0) score++;

  return score;
}

/**
 * Calculate a completeness score for Simple Break-Even
 */
function calculateSimpleScore(simple: any): number {
  let score = 0;

  if (simple.enteredSales > 0) score++;
  if (simple.ownersReturn > 0) score++;
  if (simple.rent > 0) score++;
  if (simple.variableCogs > 0) score++;
  if (simple.variableLabour > 0) score++;
  if (simple.variableOther > 0) score++;

  return score;
}
