import { HolidayBumpProfileName } from "../types/projectTypes";

export function getHolidayBumpFactors(profile: HolidayBumpProfileName): number[] {
  const base = new Array(12).fill(1);

  if (profile === "None") {
    return base;
  }

  const factors = [...base];

  if (profile === "SchoolHolidays" || profile === "Both") {
    factors[0] += 0.10;
    factors[3] += 0.08;
    factors[6] += 0.06;
    factors[8] += 0.06;
    factors[11] += 0.12;
  }

  if (profile === "PublicHolidays" || profile === "Both") {
    factors[0] += 0.05;
    factors[3] += 0.05;
    factors[5] += 0.03;
    factors[9] += 0.03;
    factors[11] += 0.07;
  }

  return factors;
}
