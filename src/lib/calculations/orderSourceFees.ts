import { OrderSourceBreakdownItem, OrderSourceKey } from '../types/projectTypes';

export interface AggregatorFees {
  uberFees: number;
  doordashFees: number;
  appProviderFees: number;
  biteBusinessFees: number;
  totalFees: number;
  percentOfSales: number;
}

export function calculateAggregatorFees(
  orderSources: OrderSourceBreakdownItem[],
  salesAmount: number,
  weeksInPeriod: number
): AggregatorFees {
  let uberFees = 0;
  let doordashFees = 0;
  let appProviderFees = 0;
  let biteBusinessFees = 0;

  orderSources.forEach(source => {
    const portionOfSales = (source.percent / 100) * salesAmount;

    switch (source.key as OrderSourceKey) {
      case 'uberDelivery':
        uberFees += portionOfSales * 0.30;
        break;
      case 'uberPickup':
        uberFees += portionOfSales * 0.15;
        break;
      case 'doordashDelivery':
        doordashFees += portionOfSales * 0.30;
        break;
      case 'doordashPickup':
        doordashFees += portionOfSales * 0.15;
        break;
      case 'appOther':
        appProviderFees += portionOfSales * 0.06;
        break;
      case 'appBiteBusiness':
        biteBusinessFees += 50 * weeksInPeriod;
        break;
      default:
        break;
    }
  });

  const totalFees = uberFees + doordashFees + appProviderFees + biteBusinessFees;
  const percentOfSales = salesAmount > 0 ? totalFees / salesAmount : 0;

  return {
    uberFees,
    doordashFees,
    appProviderFees,
    biteBusinessFees,
    totalFees,
    percentOfSales,
  };
}
