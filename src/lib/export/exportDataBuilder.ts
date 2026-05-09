import { ProjectData } from "../types/projectTypes";
import { calculateProjectSummary, ProjectSummary } from "../calculations/projectSummary";
import { generateForecast, ForecastResult } from "../calculations/forecastEngine";
import { generateInsights, Insight } from "../calculations/insightsEngine";

export interface ExportData {
  project: ProjectData;
  summary: ProjectSummary;
  forecast: ForecastResult;
  insights: Insight[];
}

export function buildExportData(project: ProjectData): ExportData {
  const summary = calculateProjectSummary(project);
  const forecast = generateForecast(project, summary);
  const insights = generateInsights(project, summary);

  return {
    project,
    summary,
    forecast,
    insights,
  };
}

export function getAnnualExpectedSales(project: ProjectData, summary: ProjectSummary): number {
  const sales = project.simpleBreakEven.enteredSales;
  if (sales <= 0) return summary.requiredSalesToPayOwner;

  switch (project.period) {
    case "Weekly":
      return sales * 52;
    case "Monthly":
      return sales * 12;
    case "Yearly":
    default:
      return sales;
  }
}

export function getViabilityNarrative(
  project: ProjectData,
  summary: ProjectSummary
): string {
  const annualSales = getAnnualExpectedSales(project, summary);
  const formattedSales = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(annualSales);

  switch (summary.healthRating) {
    case "Unviable":
      return `Based on your current assumptions, this business model appears unviable. Your expected sales do not cover the revenue required to break even or you cannot fully fund the fitout and working capital. Review your assumptions before proceeding.`;

    case "LikelyViable":
      return `This business appears likely viable, but your assumptions are tight. Your expected sales of ${formattedSales} are only slightly above the revenue required to break even. Small changes in rent, labour, or sales could push the business into loss.`;

    case "Viable":
      return `Based on your current assumptions, this business appears commercially viable. Your expected annual sales of ${formattedSales} provide a healthy buffer over your break-even revenue.`;

    case "LookingGood":
      return `This opportunity is looking strong. Your expected annual sales of ${formattedSales} are significantly above break-even, with rent and variable costs in a typical or favourable range for this kind of venue.`;

    default:
      return `Business viability assessment based on your expected annual sales of ${formattedSales}.`;
  }
}
