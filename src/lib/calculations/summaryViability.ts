import { ProjectSummary } from "./projectSummary";

export type StatusLevel = "good" | "borderline" | "bad";

export interface ViabilityStatus {
  breakEvenStatus: StatusLevel;
  breakEvenMessage: string;
  hourlyStatus: StatusLevel;
  hourlyMessage: string;
  fundingStatus: StatusLevel;
  fundingMessage: string;
  overallStatus: StatusLevel;
  overallLabel: string;
  overallMessage: string;
  recommendation: string;
}

export function evaluateViability(summary: ProjectSummary): ViabilityStatus {
  const expectedSalesAnnual = summary.requiredSalesToPayOwner * 1.2;
  const breakEvenSalesAnnual = summary.requiredSalesToBreakEven;
  const salesToPayOwnerAnnual = summary.requiredSalesToPayOwner;
  const requiredSalesPerTradingHour = summary.requiredSalesPerTradingHour;
  const totalFitoutCost = summary.totalFitoutCost;
  const fundingGap = summary.fundingGap;

  let breakEvenStatus: StatusLevel = "good";
  let breakEvenMessage = "";

  const beRatio =
    breakEvenSalesAnnual > 0
      ? expectedSalesAnnual / breakEvenSalesAnnual
      : 0;
  const ownerRatio =
    salesToPayOwnerAnnual > 0
      ? expectedSalesAnnual / salesToPayOwnerAnnual
      : 0;

  if (beRatio < 1.05 || ownerRatio < 0.9) {
    breakEvenStatus = "bad";
    breakEvenMessage =
      "Expected sales are too close to or below what you need. This is very risky.";
  } else if (beRatio < 1.3 || ownerRatio < 1.1) {
    breakEvenStatus = "borderline";
    breakEvenMessage =
      "Expected sales are only slightly above requirements. There's not much safety margin.";
  } else {
    breakEvenStatus = "good";
    breakEvenMessage =
      "Expected sales comfortably exceed break-even and owner targets.";
  }

  let hourlyStatus: StatusLevel = "good";
  let hourlyMessage = "";

  if (!requiredSalesPerTradingHour || requiredSalesPerTradingHour <= 0) {
    hourlyStatus = "borderline";
    hourlyMessage = "Trading hours are not set, so hourly targets are unclear.";
  } else if (requiredSalesPerTradingHour > 450) {
    hourlyStatus = "bad";
    hourlyMessage =
      "Hourly sales target is extremely demanding for most venues.";
  } else if (requiredSalesPerTradingHour > 350) {
    hourlyStatus = "borderline";
    hourlyMessage =
      "Hourly sales target is high and will require strong execution.";
  } else {
    hourlyStatus = "good";
    hourlyMessage =
      "Hourly sales target looks realistic for a well-run venue.";
  }

  let fundingStatus: StatusLevel = "good";
  let fundingMessage = "";
  let fundingNotAssessed = false;

  // Check if fitout costs have been entered (if total is 0, it hasn't been assessed)
  if (totalFitoutCost === 0) {
    fundingStatus = "borderline";
    fundingMessage =
      "Fitout costs not yet assessed. Unable to evaluate funding needs.";
    fundingNotAssessed = true;
  } else {
    const fundingPct = fundingGap / totalFitoutCost;

    if (fundingGap > 0 && fundingPct > 0.05) {
      fundingStatus = "bad";
      fundingMessage =
        "There is a funding shortfall. Many businesses fail due to being under-funded at the start.";
    } else if (fundingGap > 0 || Math.abs(fundingPct) < 0.1) {
      fundingStatus = "borderline";
      fundingMessage =
        "Funding is tight. You have little or no buffer for overruns or slow trade.";
    } else {
      fundingStatus = "good";
      fundingMessage = "Funding and fitout budget include a reasonable buffer.";
    }
  }

  let overallStatus: StatusLevel = "good";
  let overallLabel = "Viable";
  let overallMessage = "";
  let recommendation = "";

  if (breakEvenStatus === "bad" || hourlyStatus === "bad" || fundingStatus === "bad") {
    overallStatus = "bad";
    overallLabel = "High Risk / Likely Unviable";
    overallMessage =
      "On your current numbers this opportunity looks very risky.";

    // Build context-aware recommendation based on which factors are bad
    const criticalIssues: string[] = [];
    if (fundingStatus === "bad") {
      criticalIssues.push("you have a significant funding shortfall");
    }
    if (breakEvenStatus === "bad") {
      criticalIssues.push("your expected sales are too close to or below break-even");
    }
    if (hourlyStatus === "bad") {
      criticalIssues.push("your required hourly sales are unrealistic");
    }

    recommendation =
      `Don't proceed on these numbers. This is high risk because ${criticalIssues.join(", and ")}. Rework your costs, sales assumptions or funding before committing.`;
  } else if (
    breakEvenStatus === "borderline" ||
    hourlyStatus === "borderline" ||
    fundingStatus === "borderline"
  ) {
    overallStatus = "borderline";
    overallLabel = "Borderline / Proceed With Caution";
    overallMessage =
      "The opportunity is borderline. There's not much safety margin.";

    // Build context-aware recommendation based on which factors are borderline
    const issues: string[] = [];
    const notAssessed: string[] = [];

    if (fundingStatus === "borderline") {
      if (fundingNotAssessed) {
        notAssessed.push("fitout costs and funding");
      } else {
        issues.push("you don't have enough funding buffer");
      }
    }
    if (breakEvenStatus === "borderline") {
      issues.push("your sales targets are too close to break-even");
    }
    if (hourlyStatus === "borderline") {
      issues.push("your required hourly sales are demanding");
    }

    if (notAssessed.length > 0 && issues.length === 0) {
      // Only "not assessed" issues - guide them to complete the assessment
      recommendation =
        `Based on the limited information, this could work. Complete the Detailed Break-Even and Fitout & Financing sections to get a full assessment of viability.`;
    } else if (notAssessed.length > 0 && issues.length > 0) {
      // Mix of real issues and not assessed
      recommendation =
        `Treat this as a maybe. This is borderline because ${issues.join(", and ")}, and you haven't assessed ${notAssessed.join(", and ")} yet. Complete the Detailed Break-Even and Fitout & Financing sections before making a decision.`;
    } else {
      // Only real issues, no "not assessed"
      recommendation =
        `Treat this as a maybe. This is borderline because ${issues.join(", and ")}. Build a detailed break-even, labour and marketing plan before signing anything.`;
    }
  } else {
    overallStatus = "good";
    overallLabel = "Looks Viable";
    overallMessage =
      "The numbers look reasonable and worth exploring further.";
    recommendation =
      "This looks worth pursuing. Next step: build a detailed break-even and full business plan.";
  }

  return {
    breakEvenStatus,
    breakEvenMessage,
    hourlyStatus,
    hourlyMessage,
    fundingStatus,
    fundingMessage,
    overallStatus,
    overallLabel,
    overallMessage,
    recommendation,
  };
}
