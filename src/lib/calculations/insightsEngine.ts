import { ProjectData } from "../types/projectTypes";
import { ProjectSummary } from "./projectSummary";
import { evaluateHourlySalesBenchmark, venueTypeLabel } from "./hourlyBenchmarks";

export type InsightSeverity = "info" | "warning" | "critical";

export type InsightCategory =
  | "Rent"
  | "Labour"
  | "COGS"
  | "OtherExpenses"
  | "Funding"
  | "Hours"
  | "SalesMix"
  | "Location";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  message: string;
  suggestion?: string;
}

export function generateInsights(
  project: ProjectData,
  summary: ProjectSummary
): Insight[] {
  const insights: Insight[] = [];

  const simple = project.simpleBreakEven;
  const detailed = project.detailedBreakEven;
  const sales = project.salesBreakup;

  const baseScenario = detailed.scenario1;

  const totalVariablePercent =
    baseScenario.variableCogs +
    baseScenario.variableLabour +
    baseScenario.variableOther;

  const rentPercentOfExpectedSales =
    summary.annualExpectedSales > 0
      ? (simple.rent / summary.annualExpectedSales) * 100
      : 0;

  if (rentPercentOfExpectedSales > 12) {
    insights.push({
      id: "rent-high",
      severity: rentPercentOfExpectedSales > 15 ? "critical" : "warning",
      category: "Rent",
      title: "Rent as a percentage of expected sales is high",
      message: `Rent is approximately ${rentPercentOfExpectedSales.toFixed(
        1
      )}% of your expected annual sales.`,
      suggestion:
        "Consider negotiating a lower rent, choosing a smaller site, or lifting expected sales if the market and concept support it."
    });
  }

  if (totalVariablePercent > 70) {
    insights.push({
      id: "variable-high",
      severity: totalVariablePercent > 80 ? "critical" : "warning",
      category: "OtherExpenses",
      title: "Combined variable costs are high",
      message: `COGS, labour, and other variable costs total approximately ${totalVariablePercent.toFixed(
        1
      )}% of sales in your base scenario.`,
      suggestion:
        "Review menu pricing, supplier costs, and labour scheduling. Aim to reduce total variable costs or increase menu prices."
    });
  }

  if (summary.fundingGap > 0) {
    insights.push({
      id: "funding-gap",
      severity: "critical",
      category: "Funding",
      title: "You do not have enough funding to open",
      message: `You are short by approximately $${summary.fundingGap.toFixed(
        0
      )} based on your fitout + working capital assumptions in scenario 1.`,
      suggestion:
        "You may need to reduce fitout costs, contribute more cash, or increase finance to fully fund the project."
    });
  }

  if (summary.requiredSalesPerTradingHour && summary.requiredSalesPerTradingHour > 0) {
    const venueType = project.detailedBreakEven.scenario1.venueType || "Cafe";
    const bench = evaluateHourlySalesBenchmark(
      venueType,
      summary.requiredSalesPerTradingHour
    );

    if (bench) {
      const sph = bench.hourlyValue;
      const band = bench.band;

      insights.push({
        id: "sales-per-hour-benchmark",
        severity: "info",
        category: "Hours",
        title: "Required sales per trading hour benchmarked",
        message: `You need roughly $${sph.toFixed(
          0
        )} in sales per trading hour. For a ${venueTypeLabel(
          venueType
        )} this sits in the "${band.label}" band.`,
        suggestion: band.description,
      });

      if (bench.position === "Aggressive") {
        insights.push({
          id: "sales-per-hour-aggressive",
          severity: "warning",
          category: "Hours",
          title: "Required sales per trading hour is ambitious for this venue type",
          message: `Your required sales per trading hour are very ambitious for a ${venueTypeLabel(
            venueType
          )}.`,
          suggestion:
            "Double-check your rent, hours, and cost structure. Make sure your location, brand, and demand can realistically support this level of throughput.",
        });
      }
    }
  }

  const totalSalesPercent =
    sales.dayPercentages.monday +
    sales.dayPercentages.tuesday +
    sales.dayPercentages.wednesday +
    sales.dayPercentages.thursday +
    sales.dayPercentages.friday +
    sales.dayPercentages.saturday +
    sales.dayPercentages.sunday;

  if (Math.abs(totalSalesPercent - 100) > 1) {
    insights.push({
      id: "sales-mix-not-100",
      severity: "warning",
      category: "SalesMix",
      title: "Sales mix percentages do not add to 100%",
      message: `Your sales breakup currently totals ${totalSalesPercent.toFixed(
        1
      )}%.`,
      suggestion:
        "Adjust your sales breakup percentages so they total 100% to get accurate forecasts by channel/day/service."
    });
  }

  if (baseScenario.variableCogs > 35) {
    insights.push({
      id: "cogs-high",
      severity: baseScenario.variableCogs > 40 ? "warning" : "info",
      category: "COGS",
      title: "Cost of Goods Sold is above typical range",
      message: `Your COGS is ${baseScenario.variableCogs.toFixed(1)}%. Industry standard for food service is typically 28-35%.`,
      suggestion:
        "Review supplier pricing, portion control, and menu engineering to reduce food costs. Negotiate bulk discounts or consider alternative suppliers."
    });
  }

  if (baseScenario.variableLabour > 35) {
    insights.push({
      id: "labour-high",
      severity: baseScenario.variableLabour > 40 ? "warning" : "info",
      category: "Labour",
      title: "Labour costs are above typical range",
      message: `Your labour cost is ${baseScenario.variableLabour.toFixed(1)}%. Industry standard for food service is typically 25-35%.`,
      suggestion:
        "Review staffing schedules to match demand, cross-train employees, and optimize shift planning. Consider your Hours of Operation data to align labour with busy periods."
    });
  }

  const contributionMargin = 100 - totalVariablePercent;
  if (contributionMargin > 50) {
    insights.push({
      id: "contribution-margin-strong",
      severity: "info",
      category: "OtherExpenses",
      title: "Strong contribution margin",
      message: `Your contribution margin of ${contributionMargin.toFixed(1)}% is excellent. You have good pricing power and cost control.`,
      suggestion:
        "Maintain this advantage by monitoring costs regularly and protecting your pricing strategy."
    });
  }

  if (project.locationSuitabilityScore !== null && project.locationSuitabilityScore !== undefined) {
    const score = project.locationSuitabilityScore;

    if (score < 40) {
      insights.push({
        id: "location-poor",
        severity: "warning",
        category: "Location",
        title: "Location suitability is low",
        message: `This site scores ${score}/100 on Mojo's location suitability rating.`,
        suggestion: "Consider alternative premises or negotiate rent heavily."
      });
    } else if (score < 60) {
      insights.push({
        id: "location-workable",
        severity: "info",
        category: "Location",
        title: "Location is workable with some limitations",
        message: `This site scores ${score}/100.`,
        suggestion: "Check break-even and rent carefully."
      });
    } else if (score < 80) {
      insights.push({
        id: "location-good",
        severity: "info",
        category: "Location",
        title: "Location is strong",
        message: `This site scores ${score}/100, indicating good potential.`
      });
    } else {
      insights.push({
        id: "location-excellent",
        severity: "info",
        category: "Location",
        title: "Location looks very promising",
        message: `This site scores ${score}/100.`,
        suggestion: "Proceed to detailed break-even and negotiation."
      });
    }
  }

  return insights;
}
