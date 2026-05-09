import { ProjectData } from "../types/projectTypes";

export interface LocationScoreBreakdown {
  financial: number;
  catchment: number;
  visibility: number;
  activity: number;
  total: number;
}

export function calculateLocationSuitability(project: ProjectData): LocationScoreBreakdown {
  const loc = project.location || {};
  let financial = 0;
  let catchment = 0;
  let visibility = 0;
  let activity = 0;

  let annualSales = 0;
  if (project.simpleBreakEven.enteredSales > 0) {
    switch (project.period) {
      case "Weekly":
        annualSales = project.simpleBreakEven.enteredSales * 52;
        break;
      case "Monthly":
        annualSales = project.simpleBreakEven.enteredSales * 12;
        break;
      case "Yearly":
      default:
        annualSales = project.simpleBreakEven.enteredSales;
        break;
    }
  }

  const rent = loc.annualRent || 0;

  if (annualSales > 0 && rent > 0) {
    const rentRatio = rent / annualSales;

    if (rentRatio <= 0.08) financial = 25;
    else if (rentRatio <= 0.10) financial = 20;
    else if (rentRatio <= 0.12) financial = 15;
    else if (rentRatio <= 0.15) financial = 10;
    else financial = 5;
  }

  switch (loc.catchmentStrength) {
    case "VeryStrong":
      catchment = 25;
      break;
    case "Strong":
      catchment = 18;
      break;
    case "Moderate":
      catchment = 12;
      break;
    case "Weak":
    default:
      catchment = 6;
  }

  switch (loc.visibility) {
    case "Prime":
      visibility = 25;
      break;
    case "Strong":
      visibility = 18;
      break;
    case "Average":
      visibility = 12;
      break;
    case "Poor":
    default:
      visibility = 6;
  }

  switch (loc.nearbyActivity) {
    case "High":
      activity = 25;
      break;
    case "Strong":
      activity = 18;
      break;
    case "Moderate":
      activity = 12;
      break;
    case "Low":
    default:
      activity = 6;
  }

  const total = financial + catchment + visibility + activity;

  return {
    financial,
    catchment,
    visibility,
    activity,
    total,
  };
}
