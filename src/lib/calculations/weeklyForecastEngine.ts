import { ForecastResult } from "./forecastEngine";

export interface WeeklyForecastRow {
  weekIndex: number;
  weekEnding: string;
  revenue: number;
  costs: number;
  surplus: number;
}

export function generateWeeklyForecast(
  forecast: ForecastResult,
  openingDateISO: string
): WeeklyForecastRow[] {
  const rows: WeeklyForecastRow[] = [];

  const openingDate = new Date(openingDateISO);
  if (isNaN(openingDate.getTime())) return rows;

  for (let i = 0; i < 52; i++) {
    const start = new Date(openingDate);
    start.setDate(start.getDate() + i * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const monthIndex = Math.min(11, Math.floor((i / 52) * 12));
    const month = forecast.months[monthIndex];

    const revenue = month.revenue / 4.333;
    const costs = month.totalCosts / 4.333;
    const surplus = month.surplus / 4.333;

    rows.push({
      weekIndex: i + 1,
      weekEnding: end.toISOString().split("T")[0],
      revenue,
      costs,
      surplus,
    });
  }

  return rows;
}
