export interface FitScoreInput {
  annualRevenueEstimate: number;
  locationCount: number;
  franchiseType?: string | null;
  posSystem?: string | null;
  accountingSystem?: string | null;
  rosteringSystem?: string | null;
}

export interface FitScoreResult {
  score: number;
  tier: "NotSuitable" | "CoreMarket" | "HighLeverage";
}

export function calculateMojoFitScore(input: FitScoreInput): FitScoreResult {
  let index = 0;

  if (input.annualRevenueEstimate < 500000) index += 10;
  else if (input.annualRevenueEstimate < 2000000) index += 25;
  else index += 35;

  if (input.locationCount <= 1) index += 10;
  else if (input.locationCount <= 5) index += 20;
  else index += 25;

  const ft = (input.franchiseType || "").toLowerCase();
  if (ft.includes("franchisee")) index -= 30;
  if (ft.includes("emerging")) index += 25;
  if (ft.includes("multi") || ft.includes("group")) index += 20;

  const pos = (input.posSystem || "").toLowerCase();
  const acct = (input.accountingSystem || "").toLowerCase();
  const rost = (input.rosteringSystem || "").toLowerCase();

  if (pos.includes("imagatec") || pos.includes("lightspeed") || pos.includes("square")) {
    index += 10;
  }
  if (acct.includes("xero")) {
    index += 10;
  }
  if (rost.includes("tanda") || rost.includes("deputy")) {
    index += 10;
  }

  if (index < 0) index = 0;
  if (index > 100) index = 100;

  let tier: FitScoreResult["tier"] = "NotSuitable";
  if (index >= 70) tier = "HighLeverage";
  else if (index >= 40) tier = "CoreMarket";

  return { score: index, tier };
}
