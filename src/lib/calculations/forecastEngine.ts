import { ProjectData } from "../types/projectTypes";
import { ProjectSummary } from "./projectSummary";
import { getSeasonalityFactors } from "./seasonalityProfiles";
import { getHolidayBumpFactors } from "./holidayBumpProfiles";

export interface ForecastMonth {
  monthIndex: number;
  label: string;
  revenue: number;
  totalCosts: number;
  surplus: number;
}

export interface ForecastResult {
  months: ForecastMonth[];
  annualRevenue: number;
  annualSurplus: number;
  breakEvenMonthIndex: number | null;
}

export function generateForecast(
  project: ProjectData,
  summary: ProjectSummary
): ForecastResult {
  const months: ForecastMonth[] = [];

  const simple = project.simpleBreakEven;
  const baseScenario = project.detailedBreakEven.scenario1;

  let targetAnnualSales: number;

  if (simple.enteredSales <= 0) {
    targetAnnualSales = summary.requiredSalesToPayOwner;
  } else {
    switch (project.period) {
      case "Weekly":
        targetAnnualSales = simple.enteredSales * 52;
        break;
      case "Monthly":
        targetAnnualSales = simple.enteredSales * 12;
        break;
      case "Yearly":
      default:
        targetAnnualSales = simple.enteredSales;
        break;
    }
  }

  const seasonalityProfile = project.seasonalityProfile || "Flat";
  const holidayProfile = project.holidayBumpProfile || "None";

  const seasonalityFactors = getSeasonalityFactors(seasonalityProfile);
  const holidayFactors = getHolidayBumpFactors(holidayProfile);

  const startRamp = 0.4;
  const endRamp = 1.0;

  const combinedFactors: number[] = [];

  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const ramp = startRamp + (endRamp - startRamp) * t;
    const season = seasonalityFactors[i] ?? 1;
    const holiday = holidayFactors[i] ?? 1;

    combinedFactors.push(ramp * season * holiday);
  }

  const factorSum = combinedFactors.reduce((sum, f) => sum + f, 0) || 1;

  let annualFixedCosts: number;
  switch (project.period) {
    case "Weekly":
      annualFixedCosts = summary.totalFixedCosts * 52;
      break;
    case "Monthly":
      annualFixedCosts = summary.totalFixedCosts * 12;
      break;
    case "Yearly":
    default:
      annualFixedCosts = summary.totalFixedCosts;
      break;
  }
  const fixedCostsPerMonth = annualFixedCosts / 12;

  const variableCostPercent =
    baseScenario.variableCogs +
    baseScenario.variableLabour +
    baseScenario.variableOther;

  let annualRevenue = 0;
  let annualSurplus = 0;
  let breakEvenMonthIndex: number | null = null;

  for (let i = 0; i < 12; i++) {
    const monthIndex = i + 1;
    const factorShare = combinedFactors[i] / factorSum;

    const revenue = targetAnnualSales * factorShare;

    const variableCosts = revenue * (variableCostPercent / 100);
    const totalCosts = variableCosts + fixedCostsPerMonth;
    const surplus = revenue - totalCosts;

    annualRevenue += revenue;
    annualSurplus += surplus;

    if (breakEvenMonthIndex === null && surplus >= 0) {
      breakEvenMonthIndex = monthIndex;
    }

    months.push({
      monthIndex,
      label: `Month ${monthIndex}`,
      revenue,
      totalCosts,
      surplus,
    });
  }

  return {
    months,
    annualRevenue,
    annualSurplus,
    breakEvenMonthIndex,
  };
}
