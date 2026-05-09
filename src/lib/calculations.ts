export { formatCurrency, formatPercentage } from '@/lib/format';

export const PERIOD_OUTPUT_FACTORS = {
  Weekly: 1,
  Monthly: 4.33,
  Yearly: 52,
};

export const calculateRequiredSales = (
  fixedCosts: number,
  ownersReturn: number,
  variablePercentage: number
): number => {
  if (variablePercentage >= 100) return 0;
  return (fixedCosts + ownersReturn) / (1 - variablePercentage / 100);
};

export const calculateFixedCosts = (
  rent: number,
  annualCosts: number,
  outputFactor: number
): number => {
  return rent + annualCosts / outputFactor;
};
