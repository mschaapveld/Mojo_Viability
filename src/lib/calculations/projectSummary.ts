import { ProjectData, DaySchedule } from "../types/projectTypes";
import { calculateHoursBetween } from "../timeUtils";
import { calculateLocationSuitability } from "./locationSuitability";
import { calculateAggregatorFees, AggregatorFees } from "./orderSourceFees";
import { selectDataSource, DataSource } from "./dataSourceSelector";

export type HealthRating = "Unviable" | "LikelyViable" | "Viable" | "LookingGood";

export interface ProjectSummary {
  requiredSalesToBreakEven: number;
  requiredSalesToPayOwner: number;
  totalFixedCosts: number;
  totalFitoutCost: number;
  fundingGap: number;
  healthRating: HealthRating;
  annualExpectedSales: number;
  requiredSalesPerTradingHour: number | null;
  aggregatorFees?: AggregatorFees;
  dataSource: DataSource;
  isAssumptionHeavy: boolean;
}

function calculateDailyHours(day: DaySchedule): number {
  if (!day.open) return 0;

  const breakfast = calculateHoursBetween(day.breakfast.start, day.breakfast.end);
  const lunch = calculateHoursBetween(day.lunch.start, day.lunch.end);
  const dinner = calculateHoursBetween(day.dinner.start, day.dinner.end);

  return breakfast + lunch + dinner;
}

function calculateWeeklyHours(project: ProjectData): number {
  const { hoursOfOperation } = project;

  return (
    calculateDailyHours(hoursOfOperation.monday) +
    calculateDailyHours(hoursOfOperation.tuesday) +
    calculateDailyHours(hoursOfOperation.wednesday) +
    calculateDailyHours(hoursOfOperation.thursday) +
    calculateDailyHours(hoursOfOperation.friday) +
    calculateDailyHours(hoursOfOperation.saturday) +
    calculateDailyHours(hoursOfOperation.sunday)
  );
}

export function calculateProjectSummary(project: ProjectData): ProjectSummary {
  const { simpleBreakEven, detailedBreakEven, fitoutFinancing } = project;

  // Determine which data source to use
  const sourceInfo = selectDataSource(project);
  const useDetailed = sourceInfo.source === "detailed";

  // Calculate fixed costs based on source
  let totalFixedCostsMonthly: number;
  let ownersReturnValue: number;
  let enteredSalesValue: number;

  if (useDetailed) {
    const detailed = detailedBreakEven.scenario1;

    // Convert to monthly basis for consistent calculation
    const periodMultiplier = project.period === "Weekly" ? (52 / 12) : project.period === "Yearly" ? (1 / 12) : 1;

    const rentMonthly = detailed.rent * periodMultiplier;
    const labourMonthly = detailed.labourMinimumCost * periodMultiplier;
    const insuranceMonthly = (detailed.insurance || 0) * periodMultiplier;
    const accountingMonthly = (detailed.accounting || 0) * periodMultiplier;
    const marketingMonthly = (detailed.marketing || 0) * periodMultiplier;
    const utilitiesMonthly = (detailed.utilities || 0) * periodMultiplier;
    const otherFixedMonthly = (detailed.otherFixed || 0) * periodMultiplier;
    const customFixedTotal = (detailed.customFixedCosts || []).reduce((sum, c) => sum + (c.value * periodMultiplier), 0);

    totalFixedCostsMonthly = rentMonthly + labourMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotal;
    ownersReturnValue = detailed.ownersReturn;
    enteredSalesValue = detailed.enteredSales;
  } else {
    // Simple Break-Even
    const periodMultiplier = project.period === "Weekly" ? (52 / 12) : project.period === "Yearly" ? (1 / 12) : 1;
    totalFixedCostsMonthly = simpleBreakEven.rent * periodMultiplier;
    ownersReturnValue = simpleBreakEven.ownersReturn;
    enteredSalesValue = simpleBreakEven.enteredSales;
  }

  // Convert to period-based for display
  const periodDivisor = project.period === "Weekly" ? (52 / 12) : project.period === "Yearly" ? (1 / 12) : 1;
  const totalFixedCosts = totalFixedCostsMonthly / periodDivisor;

  let targetAnnualSales: number;

  if (enteredSalesValue <= 0) {
    targetAnnualSales = 0;
  } else {
    switch (project.period) {
      case "Weekly":
        targetAnnualSales = enteredSalesValue * 52;
        break;
      case "Monthly":
        targetAnnualSales = enteredSalesValue * 12;
        break;
      case "Yearly":
      default:
        targetAnnualSales = enteredSalesValue;
        break;
    }
  }

  const orderSources = project.orderSources || [{ key: "orderInVenue", label: "Order in Venue", percent: 100 }];
  const aggregatorFees = calculateAggregatorFees(orderSources, targetAnnualSales, 52);

  const aggregatorPercent = aggregatorFees.percentOfSales * 100;

  // Calculate variable costs based on source
  let variablePercent: number;

  if (useDetailed) {
    const detailed = detailedBreakEven.scenario1;
    const franchiseFees = detailed.isFranchise ?
      (detailed.franchiseRoyaltyPercent || 0) + (detailed.franchiseMarketingPercent || 0) : 0;

    variablePercent =
      detailed.variableCogs +
      detailed.variableLabour +
      detailed.variableOther +
      franchiseFees +
      aggregatorPercent;
  } else {
    variablePercent =
      simpleBreakEven.variableCogs +
      simpleBreakEven.variableLabour +
      simpleBreakEven.variableOther +
      aggregatorPercent;
  }

  const requiredSalesToBreakEven =
    totalFixedCosts / (1 - variablePercent / 100);

  const requiredSalesToPayOwner =
    (totalFixedCosts + ownersReturnValue) /
    (1 - variablePercent / 100);

  const scenario = fitoutFinancing.scenario1;

  const totalFitoutCost =
    scenario.equipment +
    scenario.furniture +
    scenario.tech +
    scenario.stock +
    scenario.fitout +
    scenario.signage +
    (scenario.designFees || 0) +
    scenario.legal +
    scenario.operatingCapital +
    (scenario.customSetupCosts || []).reduce((sum, c) => sum + c.amount, 0);

  const availableFunding =
    scenario.startupCapital +
    scenario.loanAmount +
    scenario.equipmentRentalAmount;

  const fundingGap = totalFitoutCost - availableFunding;

  if (simpleBreakEven.enteredSales <= 0) {
    targetAnnualSales = requiredSalesToPayOwner;
  }

  const beCoverageRatio =
    requiredSalesToBreakEven > 0
      ? targetAnnualSales / requiredSalesToBreakEven
      : 0;

  const rentRatio =
    targetAnnualSales > 0 ? simpleBreakEven.rent / targetAnnualSales : 0;

  const variableRatio = variablePercent / 100;

  let healthRating: HealthRating = "LikelyViable";

  if (
    fundingGap > 0 ||
    beCoverageRatio < 1.0
  ) {
    healthRating = "Unviable";
  } else if (
    beCoverageRatio >= 1.0 &&
    beCoverageRatio < 1.3
  ) {
    healthRating = "LikelyViable";
  } else if (
    beCoverageRatio >= 1.3 &&
    beCoverageRatio < 1.7 &&
    rentRatio <= 0.15 &&
    variableRatio <= 0.75
  ) {
    healthRating = "Viable";
  } else if (
    beCoverageRatio >= 1.7 &&
    rentRatio <= 0.12 &&
    variableRatio <= 0.7
  ) {
    healthRating = "LookingGood";
  } else {
    healthRating = "Viable";
  }

  let annualRequiredSalesToPayOwner: number;

  switch (project.period) {
    case "Weekly":
      annualRequiredSalesToPayOwner = requiredSalesToPayOwner * 52;
      break;
    case "Monthly":
      annualRequiredSalesToPayOwner = requiredSalesToPayOwner * 12;
      break;
    case "Yearly":
    default:
      annualRequiredSalesToPayOwner = requiredSalesToPayOwner;
      break;
  }

  const weeklyHours = calculateWeeklyHours(project);
  const annualTradingHours = weeklyHours > 0 ? weeklyHours * 52 : 0;

  const requiredSalesPerTradingHour =
    annualTradingHours > 0
      ? annualRequiredSalesToPayOwner / annualTradingHours
      : null;

  const locationBreakdown = calculateLocationSuitability(project);
  project.locationSuitabilityScore = locationBreakdown.total;

  return {
    requiredSalesToBreakEven,
    requiredSalesToPayOwner,
    totalFixedCosts,
    totalFitoutCost,
    fundingGap,
    healthRating,
    annualExpectedSales: targetAnnualSales,
    requiredSalesPerTradingHour,
    aggregatorFees,
    dataSource: sourceInfo.source,
    isAssumptionHeavy: sourceInfo.isAssumptionHeavy,
  };
}
