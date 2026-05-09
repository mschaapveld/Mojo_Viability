import { VenueType } from "../types/projectTypes";

export type BenchmarkPosition = "BelowTypical" | "Typical" | "Strong" | "Aggressive";

export interface HourlyBenchmarkBand {
  label: string;
  min: number;
  max: number | null;
  description: string;
}

export interface HourlyBenchmarkResult {
  venueType: VenueType;
  hourlyValue: number;
  position: BenchmarkPosition;
  band: HourlyBenchmarkBand;
}

type BenchmarkCategory = 'QSR' | 'Cafe' | 'Restaurant' | 'Bar' | 'Coffee';

function getBenchmarkCategory(venueType: VenueType): BenchmarkCategory {
  switch (venueType) {
    case 'Quick service restaurant (QSR)':
      return 'QSR';
    case 'Cafe':
      return 'Cafe';
    case 'Small restaurant':
    case 'Small restaurant with bar':
    case 'Medium restaurant':
    case 'Large restaurant':
      return 'Restaurant';
    case 'Small bar':
    case 'Pub / Tavern':
    case 'Live music venue':
    case 'Nightclub':
      return 'Bar';
    default:
      return 'Restaurant';
  }
}

const benchmarksByCategory: Record<BenchmarkCategory, HourlyBenchmarkBand[]> = {
  QSR: [
    {
      label: "Low utilisation",
      min: 0,
      max: 200,
      description: "Likely under-utilised or conservative for a well-located QSR.",
    },
    {
      label: "Typical range",
      min: 200,
      max: 500,
      description: "Common for busy QSR / burger shops in decent locations.",
    },
    {
      label: "Strong performance",
      min: 500,
      max: 800,
      description: "Strong hourly expectations – needs good volume and consistency.",
    },
    {
      label: "Aggressive target",
      min: 800,
      max: null,
      description: "Very ambitious – usually only achievable in prime sites.",
    },
  ],
  Cafe: [
    {
      label: "Low utilisation",
      min: 0,
      max: 150,
      description: "Conservative for a solid café.",
    },
    {
      label: "Typical range",
      min: 150,
      max: 400,
      description: "Common for busy cafés with good coffee and food.",
    },
    {
      label: "Strong performance",
      min: 400,
      max: 650,
      description: "High expectations – needs strong demand and turnover.",
    },
    {
      label: "Aggressive target",
      min: 650,
      max: null,
      description: "Very ambitious for a café – location and concept must support it.",
    },
  ],
  Restaurant: [
    {
      label: "Low utilisation",
      min: 0,
      max: 250,
      description: "Conservative or under-utilised for full-service dining.",
    },
    {
      label: "Typical range",
      min: 250,
      max: 600,
      description: "Typical for mid-range restaurants.",
    },
    {
      label: "Strong performance",
      min: 600,
      max: 900,
      description: "Strong expectations – needs good covers and spend per head.",
    },
    {
      label: "Aggressive target",
      min: 900,
      max: null,
      description: "Very ambitious – usually only achieved by high-performing venues.",
    },
  ],
  Bar: [
    {
      label: "Low utilisation",
      min: 0,
      max: 200,
      description: "Conservative for a pub/bar trading decent hours.",
    },
    {
      label: "Typical range",
      min: 200,
      max: 500,
      description: "Typical for many pubs and bars.",
    },
    {
      label: "Strong performance",
      min: 500,
      max: 900,
      description: "High expectations with strong trade.",
    },
    {
      label: "Aggressive target",
      min: 900,
      max: null,
      description: "Very ambitious – likely requires a flagship/high-volume site.",
    },
  ],
  Coffee: [
    {
      label: "Low utilisation",
      min: 0,
      max: 100,
      description: "Conservative for a grab-and-go coffee concept.",
    },
    {
      label: "Typical range",
      min: 100,
      max: 300,
      description: "Typical for many good coffee kiosks/carts/holes-in-the-wall.",
    },
    {
      label: "Strong performance",
      min: 300,
      max: 600,
      description: "Strong expectations – needs volume and efficiency.",
    },
    {
      label: "Aggressive target",
      min: 600,
      max: null,
      description: "Very ambitious – only a small % of sites hit this.",
    },
  ],
};

export function evaluateHourlySalesBenchmark(
  venueType: VenueType,
  hourlyValue: number
): HourlyBenchmarkResult | null {
  if (!hourlyValue || hourlyValue <= 0) return null;

  const category = getBenchmarkCategory(venueType);
  const bands = benchmarksByCategory[category];
  if (!bands) return null;

  const band =
    bands.find((b) =>
      b.max === null ? hourlyValue >= b.min : hourlyValue >= b.min && hourlyValue < b.max
    ) || bands[bands.length - 1];

  let position: BenchmarkPosition = "Typical";

  if (band.label.toLowerCase().includes("low")) {
    position = "BelowTypical";
  } else if (band.label.toLowerCase().includes("strong")) {
    position = "Strong";
  } else if (band.label.toLowerCase().includes("aggressive")) {
    position = "Aggressive";
  } else {
    position = "Typical";
  }

  return {
    venueType,
    hourlyValue,
    position,
    band,
  };
}

export function venueTypeLabel(venueType: VenueType): string {
  switch (venueType) {
    case "Quick service restaurant (QSR)":
      return "QSR / fast casual venue";
    case "Cafe":
      return "café venue";
    case "Small restaurant":
      return "small restaurant";
    case "Small restaurant with bar":
      return "small restaurant with bar";
    case "Medium restaurant":
      return "medium restaurant";
    case "Large restaurant":
      return "large restaurant";
    case "Small bar":
      return "small bar";
    case "Pub / Tavern":
      return "pub / tavern";
    case "Live music venue":
      return "live music venue";
    case "Nightclub":
      return "nightclub";
    default:
      return "hospitality venue";
  }
}
