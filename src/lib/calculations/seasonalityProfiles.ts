import { SeasonalityProfileName } from "../types/projectTypes";

export function getSeasonalityFactors(profile: SeasonalityProfileName): number[] {
  const base = new Array(12).fill(1);

  if (profile === "Flat") {
    return base;
  }

  if (profile === "SummerPeak") {
    return [
      1.15,
      1.10,
      1.05,
      0.95,
      0.90,
      0.85,
      0.85,
      0.90,
      0.95,
      1.00,
      1.10,
      1.20,
    ];
  }

  if (profile === "WinterPeak") {
    return [
      0.90,
      0.95,
      1.00,
      1.05,
      1.10,
      1.15,
      1.20,
      1.15,
      1.10,
      1.05,
      0.95,
      0.90,
    ];
  }

  return base;
}
