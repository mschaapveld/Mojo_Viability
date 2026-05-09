import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, TrendingUp, DollarSign, Calendar, ArrowLeft, Info, Lock, HelpCircle } from 'lucide-react';
import { ProjectData, DetailedBreakEvenScenario, SeasonalityProfileName, HolidayBumpProfileName, SalesTargetMeaning } from '@/lib/types/projectTypes';
import { addReferralFlag, getActiveScenario, WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { format, addWeeks, addMonths } from 'date-fns';
import { getSeasonalityFactors } from '@/lib/calculations/seasonalityProfiles';
import { formatCurrency } from '@/lib/format';
import { getHolidayBumpFactors } from '@/lib/calculations/holidayBumpProfiles';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';

interface SalesPredictionsProps {
  project: ProjectData;
  onUpdate: (updates: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
}

interface PredictionRow {
  period: string;
  weekNumber?: number;
  monthNumber?: number;
  revenue: number;
  cogs: number;
  labour: number;
  fixedCosts: number;
  aggregatorFees: number;
  netProfit: number;
  cumulativeProfit: number;
  isOperatingBreakEven?: boolean;
  isOwnerReturnBreakEven?: boolean;
}

function isDetailedBreakEvenReady(scenario: DetailedBreakEvenScenario): boolean {
  if (!scenario) return false;

  const hasValidSales = scenario.enteredSales > 0;
  const hasFixedCosts = scenario.rent >= 0 && scenario.labourMinimumCost >= 0;
  const hasVariableCosts = scenario.variableCogs >= 0;

  return hasValidSales && hasFixedCosts && hasVariableCosts;
}


export function SalesPredictions({ project, onUpdate, onNavigate }: SalesPredictionsProps) {
  const activeScenario = getActiveScenario(project);
  const isReady = activeScenario ? isDetailedBreakEvenReady(activeScenario) : false;

  if (!isReady) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-left">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Lock className="h-6 w-6 text-muted-foreground/60" />
              Step 9. Sales Predictions
            </CardTitle>
            <CardDescription>
              Generate realistic sales forecasts and identify break-even timelines.
            </CardDescription>
          </CardHeader>
        </Card>

        <Alert className="bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-5 w-5 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            <p className="font-semibold mb-3">Complete your Detailed Break-Even to unlock Sales Predictions</p>
            <p className="mb-3">
              Sales Predictions rely on accurate cost and break-even assumptions from your Detailed Break-Even analysis.
              This ensures your forecasts are based on decision-grade inputs rather than estimates.
            </p>
            <p className="text-sm">
              Before you can access Sales Predictions, please complete <span className="font-bold">Step 2 – Detailed Break-Even</span> with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Expected or target sales (greater than $0)</li>
              <li>Total fixed costs (rent, labour minimum, insurance, etc.)</li>
              <li>Variable cost structure (COGS, labour %, and other variable costs)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={() => onNavigate?.('/detailed-break-even')}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            Go to Detailed Break-Even
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate?.('/location-suitability')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const scenario = activeScenario!;

  const period = project.period || 'Weekly';

  let expectedWeeklySalesFromBE = 0;
  switch (period) {
    case 'Weekly':
      expectedWeeklySalesFromBE = scenario.enteredSales;
      break;
    case 'Monthly':
      expectedWeeklySalesFromBE = scenario.enteredSales / 4.33;
      break;
    case 'Yearly':
      expectedWeeklySalesFromBE = scenario.enteredSales / 52;
      break;
  }

  const rentMonthly = period === 'Weekly' ? (scenario.rent * 52 / 12) : period === 'Yearly' ? (scenario.rent / 12) : scenario.rent;
  const labourMinimumMonthly = period === 'Weekly' ? (scenario.labourMinimumCost * 52 / 12) : period === 'Yearly' ? (scenario.labourMinimumCost / 12) : scenario.labourMinimumCost;
  const insuranceMonthly = period === 'Weekly' ? (scenario.insurance * 52 / 12) : period === 'Yearly' ? (scenario.insurance / 12) : scenario.insurance;
  const accountingMonthly = period === 'Weekly' ? (scenario.accounting * 52 / 12) : period === 'Yearly' ? (scenario.accounting / 12) : scenario.accounting;
  const marketingMonthly = period === 'Weekly' ? (scenario.marketing * 52 / 12) : period === 'Yearly' ? (scenario.marketing / 12) : scenario.marketing;
  const utilitiesMonthly = period === 'Weekly' ? (scenario.utilities * 52 / 12) : period === 'Yearly' ? (scenario.utilities / 12) : scenario.utilities;
  const otherFixedMonthly = period === 'Weekly' ? (scenario.otherFixed * 52 / 12) : period === 'Yearly' ? (scenario.otherFixed / 12) : scenario.otherFixed;

  const customFixedCosts = scenario.customFixedCosts || [];
  const customFixedTotalMonthly = customFixedCosts.reduce((sum, cost) => {
    const costMonthly = period === 'Weekly' ? (cost.value * 52 / 12) : period === 'Yearly' ? (cost.value / 12) : cost.value;
    return sum + costMonthly;
  }, 0);

  const fixedCostsMonthly = rentMonthly + labourMinimumMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;

  let ownerReturnWeekly = 0;
  let ownerReturnAnnual = 0;
  switch (period) {
    case 'Weekly':
      ownerReturnWeekly = scenario.ownersReturn;
      ownerReturnAnnual = ownerReturnWeekly * 52;
      break;
    case 'Monthly':
      ownerReturnWeekly = scenario.ownersReturn / 4.33;
      ownerReturnAnnual = scenario.ownersReturn * 12;
      break;
    case 'Yearly':
      ownerReturnWeekly = scenario.ownersReturn / 52;
      ownerReturnAnnual = scenario.ownersReturn;
      break;
  }

  const variableCOGS = scenario.variableCogs;
  const variableLabourPercent = scenario.variableLabour;
  const variableOtherPercent = scenario.variableOther;

  const franchiseRoyalty = scenario.isFranchise ? (scenario.franchiseRoyaltyPercent ?? 0) : 0;
  const franchiseMarketing = scenario.isFranchise ? (scenario.franchiseMarketingPercent ?? 0) : 0;

  const expectedSalesAnnual = expectedWeeklySalesFromBE * 52;
  const rentTurnoverEnabled = scenario.rentTurnoverEnabled ?? false;
  const rentTurnoverPercent = scenario.rentTurnoverPercent ?? 0;

  let rentVariablePercent = 0;
  if (rentTurnoverEnabled) {
    const baseAnnualRent = rentMonthly * 12;
    const turnoverRate = rentTurnoverPercent / 100;
    const turnoverAnnualRent = expectedSalesAnnual * turnoverRate;
    const variableRentAnnual = Math.max(0, turnoverAnnualRent - baseAnnualRent);
    rentVariablePercent = expectedSalesAnnual > 0 ? (variableRentAnnual / expectedSalesAnnual) * 100 : 0;
  }

  const totalVariablePercent = variableCOGS + variableLabourPercent + variableOtherPercent + franchiseRoyalty + franchiseMarketing + rentVariablePercent;

  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [expectedWeeklySales, setExpectedWeeklySales] = useState(expectedWeeklySalesFromBE);
  const [seasonalityProfile, setSeasonalityProfile] = useState<SeasonalityProfileName>(project.seasonalityProfile || 'Flat');
  const [holidayBumpProfile, setHolidayBumpProfile] = useState<HolidayBumpProfileName>(project.holidayBumpProfile || 'None');
  const [eventsUplift, setEventsUplift] = useState(10);
  const [userLivingCost, setUserLivingCost] = useState(ownerReturnWeekly || 1500);
  const [salesTargetMeaning, setSalesTargetMeaning] = useState<SalesTargetMeaning>(project.salesTargetMeaning || 'steady_weekly_target');
  const [rampWeeks, setRampWeeks] = useState(project.rampWeeks || 12);
  const [capAtTarget, setCapAtTarget] = useState(project.capAtTarget ?? true);
  const [includeOwnersReturn, setIncludeOwnersReturn] = useState(true);

  useEffect(() => {
    setExpectedWeeklySales(expectedWeeklySalesFromBE);
  }, [expectedWeeklySalesFromBE]);

  useEffect(() => {
    setUserLivingCost(ownerReturnWeekly || 1500);
  }, [ownerReturnWeekly]);

  const getFormattedDate = () => {
    try {
      if (project.expectedOpeningDate) {
        return format(new Date(project.expectedOpeningDate), 'yyyy-MM-dd');
      }
      return format(new Date(), 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  const [openingDate, setOpeningDate] = useState(getFormattedDate());

  const calculateAggregatorFees = (revenue: number): number => {
    if (!project.orderSources) return 0;

    let totalFees = 0;
    project.orderSources.forEach(source => {
      const sourceRevenue = (revenue * source.percent) / 100;
      let feePercent = 0;

      switch (source.key) {
        case 'uberDelivery':
        case 'uberPickup':
          feePercent = 30;
          break;
        case 'doordashDelivery':
        case 'doordashPickup':
          feePercent = 28;
          break;
        case 'appOther':
          feePercent = 15;
          break;
        case 'website':
          feePercent = 3;
          break;
        default:
          feePercent = 0;
      }

      totalFees += (sourceRevenue * feePercent) / 100;
    });

    return totalFees;
  };

  const generatePredictions = (): { predictions: PredictionRow[], operatingBreakEvenDate: string | null, ownersReturnBreakEvenDate: string | null } => {
    try {
      const predictions: PredictionRow[] = [];
      const startDate = new Date(openingDate);

      if (isNaN(startDate.getTime())) {
        return { predictions: [], operatingBreakEvenDate: null, ownersReturnBreakEvenDate: null };
      }

      // Calculate weekly rent correctly
      let rentWeekly = 0;
      switch (period) {
        case 'Weekly':
          rentWeekly = scenario.rent;
          break;
        case 'Monthly':
          rentWeekly = scenario.rent / 4.33;
          break;
        case 'Yearly':
          rentWeekly = scenario.rent / 52;
          break;
      }

      // Debug: Log the source values
      if (process.env.NODE_ENV === 'development') {
        console.log('[Revenue Forecast Debug]', {
          period,
          rentFromScenario: scenario.rent,
          rentWeekly,
          ownersReturnFromScenario: scenario.ownersReturn,
          ownerReturnWeekly,
          includeOwnersReturn,
          expectedFixedCostWeekly: includeOwnersReturn ? (rentWeekly + ownerReturnWeekly) : rentWeekly
        });
      }

      let cumulativeProfit = 0;
      let operatingBreakEvenFound = false;
      let ownerReturnBreakEvenFound = false;
      let operatingBreakEvenDate: string | null = null;
      let ownersReturnBreakEvenDate: string | null = null;

      const periods = viewMode === 'weekly' ? 52 : 12;

    const seasonalityFactors = getSeasonalityFactors(seasonalityProfile);
    const holidayBumpFactors = getHolidayBumpFactors(holidayBumpProfile);

    const weeksWithEvents = new Set<number>();
    for (let week = 0; week < 52; week++) {
      if (Math.random() > 0.7) {
        weeksWithEvents.add(week);
      }
    }

    for (let i = 0; i < periods; i++) {
      const weekNumberInYear = viewMode === 'weekly' ? i : Math.floor(i * 52 / 12);
      let hasEvents = false;

      if (viewMode === 'weekly') {
        hasEvents = weeksWithEvents.has(i);
      } else {
        const monthStartWeek = Math.floor(i * 52 / 12);
        const monthEndWeek = Math.floor((i + 1) * 52 / 12);
        for (let week = monthStartWeek; week < monthEndWeek; week++) {
          if (weeksWithEvents.has(week)) {
            hasEvents = true;
            break;
          }
        }
      }

      let revenue = expectedWeeklySales;
      if (viewMode === 'monthly') {
        revenue = expectedWeeklySales * 4.33;
      }

      const monthIndex = viewMode === 'monthly' ? i : Math.floor((i / 52) * 12);
      const seasonalityFactor = seasonalityFactors[monthIndex];
      const holidayBumpFactor = holidayBumpFactors[monthIndex];
      revenue *= seasonalityFactor * holidayBumpFactor;

      if (hasEvents) {
        revenue *= (1 + eventsUplift / 100);
      }

      // Apply ramp-up based on selected mode
      const rampStartMultiplier = 0.6; // Start at 60% of target
      const rampUpMultiplier = Math.min(1, (weekNumberInYear + 1) / rampWeeks);
      const rampAdjusted = rampStartMultiplier + (1 - rampStartMultiplier) * rampUpMultiplier;
      revenue *= rampAdjusted;

      // For steady_weekly_target mode with capAtTarget enabled
      if (salesTargetMeaning === 'steady_weekly_target' && capAtTarget && weekNumberInYear >= rampWeeks) {
        const baseWeeklyTarget = viewMode === 'weekly' ? expectedWeeklySales : expectedWeeklySales * 4.33;
        revenue = Math.min(revenue, baseWeeklyTarget);
      }

      const cogs = (revenue * variableCOGS) / 100;

      const labourMinimumForPeriod = viewMode === 'weekly'
        ? labourMinimumMonthly / 4.33
        : labourMinimumMonthly;

      const labourAsPercentOfSales = (revenue * variableLabourPercent) / 100;
      const labour = Math.max(labourMinimumForPeriod, labourAsPercentOfSales);

      const aggregatorFees = calculateAggregatorFees(revenue);

      const variableOtherAmount = (revenue * variableOtherPercent) / 100;
      const franchiseRoyaltyAmount = (revenue * franchiseRoyalty) / 100;
      const franchiseMarketingAmount = (revenue * franchiseMarketing) / 100;
      const rentVariableAmount = (revenue * rentVariablePercent) / 100;

      const variableCostsAmount = cogs + labour + variableOtherAmount + franchiseRoyaltyAmount + franchiseMarketingAmount + rentVariableAmount;

      // Calculate fixed costs based on toggle
      let fixedCosts = 0;
      if (includeOwnersReturn) {
        // Include rent + owners return
        fixedCosts = viewMode === 'weekly'
          ? (rentWeekly + ownerReturnWeekly)
          : ((rentWeekly + ownerReturnWeekly) * 4.33);
      } else {
        // Rent only
        fixedCosts = viewMode === 'weekly'
          ? rentWeekly
          : (rentWeekly * 4.33);
      }

      const netProfit = revenue - variableCostsAmount - fixedCosts - aggregatorFees;
      cumulativeProfit += netProfit;

      const periodDate = viewMode === 'weekly'
        ? addWeeks(startDate, i)
        : addMonths(startDate, i);

      const isOperatingBreakEven = !operatingBreakEvenFound && cumulativeProfit >= 0;

      const periodsSoFar = i + 1;
      const ownerReturnForPeriods = viewMode === 'weekly'
        ? ownerReturnWeekly * periodsSoFar
        : (ownerReturnAnnual / 12) * periodsSoFar;

      const isOwnerReturnBreakEven = !ownerReturnBreakEvenFound &&
        cumulativeProfit >= ownerReturnForPeriods;

      if (isOperatingBreakEven) {
        operatingBreakEvenFound = true;
        if (!operatingBreakEvenDate) {
          operatingBreakEvenDate = format(periodDate, 'yyyy-MM-dd');
        }
      }

      if (isOwnerReturnBreakEven) {
        ownerReturnBreakEvenFound = true;
        if (!ownersReturnBreakEvenDate) {
          ownersReturnBreakEvenDate = format(periodDate, 'yyyy-MM-dd');
        }
      }

      predictions.push({
        period: format(periodDate, 'dd/MM/yy'),
        weekNumber: viewMode === 'weekly' ? i + 1 : undefined,
        monthNumber: viewMode === 'monthly' ? i + 1 : undefined,
        revenue,
        cogs,
        labour,
        fixedCosts,
        aggregatorFees,
        netProfit,
        cumulativeProfit,
        isOperatingBreakEven,
        isOwnerReturnBreakEven,
      });
    }

      // For annual_total_target mode, scale to match exact annual target
      if (salesTargetMeaning === 'annual_total_target' && predictions.length > 0) {
        const currentAnnualTotal = predictions.reduce((sum, p) => sum + p.revenue, 0);
        const targetAnnualTotal = expectedWeeklySales * 52;
        const scaleFactor = targetAnnualTotal / currentAnnualTotal;

        // Scale all revenue values and recalculate dependent values
        predictions.forEach(p => {
          p.revenue *= scaleFactor;
          p.cogs = (p.revenue * variableCOGS) / 100;

          const labourMinimumForPeriod = viewMode === 'weekly'
            ? labourMinimumMonthly / 4.33
            : labourMinimumMonthly;
          const labourAsPercentOfSales = (p.revenue * variableLabourPercent) / 100;
          p.labour = Math.max(labourMinimumForPeriod, labourAsPercentOfSales);

          p.aggregatorFees = calculateAggregatorFees(p.revenue);

          const variableOtherAmount = (p.revenue * variableOtherPercent) / 100;
          const franchiseRoyaltyAmount = (p.revenue * franchiseRoyalty) / 100;
          const franchiseMarketingAmount = (p.revenue * franchiseMarketing) / 100;
          const rentVariableAmount = (p.revenue * rentVariablePercent) / 100;

          const variableCostsAmount = p.cogs + p.labour + variableOtherAmount + franchiseRoyaltyAmount + franchiseMarketingAmount + rentVariableAmount;

          p.netProfit = p.revenue - variableCostsAmount - p.fixedCosts - p.aggregatorFees;
        });

        // Recalculate cumulative profit and break-even points
        cumulativeProfit = 0;
        operatingBreakEvenFound = false;
        ownerReturnBreakEvenFound = false;
        operatingBreakEvenDate = null;
        ownersReturnBreakEvenDate = null;

        // Reset break-even flags on all predictions before recalculating
        predictions.forEach(p => {
          p.isOperatingBreakEven = false;
          p.isOwnerReturnBreakEven = false;
        });

        predictions.forEach((p, i) => {
          cumulativeProfit += p.netProfit;
          p.cumulativeProfit = cumulativeProfit;

          const periodDate = viewMode === 'weekly'
            ? addWeeks(startDate, i)
            : addMonths(startDate, i);

          if (!operatingBreakEvenFound && cumulativeProfit >= 0) {
            operatingBreakEvenFound = true;
            operatingBreakEvenDate = format(periodDate, 'yyyy-MM-dd');
            p.isOperatingBreakEven = true;
          }

          const periodsSoFar = i + 1;
          const ownerReturnForPeriods = viewMode === 'weekly'
            ? ownerReturnWeekly * periodsSoFar
            : (ownerReturnAnnual / 12) * periodsSoFar;

          if (!ownerReturnBreakEvenFound && cumulativeProfit >= ownerReturnForPeriods) {
            ownerReturnBreakEvenFound = true;
            ownersReturnBreakEvenDate = format(periodDate, 'yyyy-MM-dd');
            p.isOwnerReturnBreakEven = true;
          }
        });
      }

      return { predictions, operatingBreakEvenDate, ownersReturnBreakEvenDate };
    } catch (error) {
      console.error('Error generating predictions:', error);
      return { predictions: [], operatingBreakEvenDate: null, ownersReturnBreakEvenDate: null };
    }
  };

  const { predictions, operatingBreakEvenDate, ownersReturnBreakEvenDate } = generatePredictions();
  const weeksUntilOwnerReturn = predictions.findIndex(p => p.isOwnerReturnBreakEven) + 1;
  const requiredSavings = weeksUntilOwnerReturn > 0
    ? userLivingCost * (viewMode === 'weekly' ? weeksUntilOwnerReturn : weeksUntilOwnerReturn * 4.33)
    : userLivingCost * 52;

  const averageAggregatorFeePercent = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.aggregatorFees, 0) / predictions.reduce((sum, p) => sum + p.revenue, 0)) * 100
    : 0;

  if (predictions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to generate sales predictions. Please ensure you have entered valid data in Detailed Break-Even,
            including opening date and financial information.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => onNavigate?.('/detailed-break-even')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Detailed Break-Even
        </Button>
      </div>
    );
  }

  const handleNavigation = (updates: Partial<ProjectData>) => {
    let referralUpdates = {};

    if (weeksUntilOwnerReturn > 26) {
      referralUpdates = addReferralFlag(project, 'financeBroker');
    }

    if (predictions[0]?.revenue < expectedWeeklySales * 0.5) {
      referralUpdates = { ...referralUpdates, ...addReferralFlag(project, 'accountant') };
    }

    if (averageAggregatorFeePercent > 20) {
      referralUpdates = { ...referralUpdates, ...addReferralFlag(project, 'posProvider') };
    }

    onUpdate({
      ...updates,
      ...referralUpdates,
      operatingBreakEvenDate: operatingBreakEvenDate || undefined,
      ownersReturnBreakEvenDate: ownersReturnBreakEvenDate || undefined,
      salesTargetMeaning,
      rampWeeks,
      capAtTarget,
    });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 9. Sales Predictions</CardTitle>
          <CardDescription>
            Forecast your revenue and identify when you'll reach break-even and owner's return.
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert className="bg-info/10 border border-info/30">
        <Info className="h-5 w-5 text-info" />
        <AlertDescription className="text-info">
          <div className="flex items-start justify-between mb-2">
            <p className="font-semibold">Data Source: Step 2 – Detailed Break-Even</p>
            {project.selectedScenario && project.scenarioMode === 'multi' && (
              <Badge variant="default">Using Scenario {project.selectedScenario}</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>Expected Sales ({period}):</div>
            <div className="font-medium">{formatCurrency(scenario.enteredSales)}</div>
            <div>Fixed Costs (Monthly):</div>
            <div className="font-medium">{formatCurrency(fixedCostsMonthly)}</div>
            <div>Variable Costs:</div>
            <div className="font-medium">{totalVariablePercent.toFixed(1)}%</div>
            <div>Owner&apos;s Return ({period}):</div>
            <div className="font-medium">{formatCurrency(scenario.ownersReturn)}</div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-info" />
              Operating Break-Even
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {operatingBreakEvenDate
                ? format(new Date(operatingBreakEvenDate), 'MMM dd, yyyy')
                : 'Not reached in 1 year'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              When revenue covers operating costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Owner's Return Break-Even
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {ownersReturnBreakEvenDate
                ? format(new Date(ownersReturnBreakEvenDate), 'MMM dd, yyyy')
                : 'Not reached in 1 year'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              When you can draw your target income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning-foreground" />
              Lifestyle Funding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              ${requiredSavings.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Savings needed to reach owner return
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Expected Weekly Sales</Label>
              <Input
                type="text"
                value={`$${expectedWeeklySales.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  const newValue = value ? parseInt(value) : 0;
                  setExpectedWeeklySales(newValue);

                  const newSalesValue = period === 'Weekly' ? newValue : period === 'Monthly' ? newValue * 4.33 : newValue * 52;
                  const updatedBreakEven = {
                    ...project.detailedBreakEven,
                    scenario1: {
                      ...scenario,
                      enteredSales: newSalesValue,
                    },
                  };
                  onUpdate({
                    detailedBreakEven: updatedBreakEven,
                  });
                }}
                className="mt-1 bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Equivalent annual total: {formatCurrency(expectedWeeklySales * 52)} (approx)
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Label className="text-sm font-medium text-muted-foreground">What does this sales target mean?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => {
                    setSalesTargetMeaning('steady_weekly_target');
                    onUpdate({ salesTargetMeaning: 'steady_weekly_target' });
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    salesTargetMeaning === 'steady_weekly_target'
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Steady weekly target (build up to this, then stabilise)</div>
                  <p className="text-xs text-muted-foreground">
                    e.g. We want to reach ${expectedWeeklySales.toLocaleString()}/week and then hover around that level.
                  </p>
                </button>
                <button
                  onClick={() => {
                    setSalesTargetMeaning('annual_total_target');
                    onUpdate({ salesTargetMeaning: 'annual_total_target' });
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    salesTargetMeaning === 'annual_total_target'
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Annual total target (weekly is an average across the year)</div>
                  <p className="text-xs text-muted-foreground">
                    e.g. ${expectedWeeklySales.toLocaleString()}/week implies ~{formatCurrency(expectedWeeklySales * 52)}/year total, with ramp-up and seasonality affecting weekly amounts.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Ramp Duration (weeks)</Label>
              <Input
                type="number"
                min="1"
                max="26"
                value={rampWeeks}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 12;
                  setRampWeeks(value);
                  onUpdate({ rampWeeks: value });
                }}
                className="mt-1 bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time to build up from 60% to full target
              </p>
            </div>

            {salesTargetMeaning === 'steady_weekly_target' && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cap at Target</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={capAtTarget}
                    onChange={(e) => {
                      setCapAtTarget(e.target.checked);
                      onUpdate({ capAtTarget: e.target.checked });
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">
                    Don&apos;t exceed target after ramp
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {capAtTarget
                    ? 'Seasonality varies within target but won\'t exceed it'
                    : 'Seasonality can push above target occasionally'}
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Seasonality Profile</Label>
              <Select
                value={seasonalityProfile}
                onValueChange={(v: SeasonalityProfileName) => {
                  setSeasonalityProfile(v);
                  onUpdate({ ...project, seasonalityProfile: v });
                }}
              >
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flat">Flat (No seasonality)</SelectItem>
                  <SelectItem value="SummerPeak">Summer Peak</SelectItem>
                  <SelectItem value="WinterPeak">Winter Peak</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Shapes revenue across months while keeping annual total the same
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Holiday Bump</Label>
              <Select
                value={holidayBumpProfile}
                onValueChange={(v: HolidayBumpProfileName) => {
                  setHolidayBumpProfile(v);
                  onUpdate({ ...project, holidayBumpProfile: v });
                }}
              >
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="SchoolHolidays">School Holidays bump</SelectItem>
                  <SelectItem value="PublicHolidays">Public Holidays bump</SelectItem>
                  <SelectItem value="Both">Both (school + public)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Adds uplift to holiday months while keeping annual sales the same
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Events Uplift (%)</Label>
              <Input
                type="number"
                value={eventsUplift}
                onChange={(e) => setEventsUplift(parseFloat(e.target.value) || 0)}
                className="mt-1 bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Random uplift applied to some periods
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Your Weekly Living Cost</Label>
              <Input
                type="text"
                value={`$${userLivingCost.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  const weeklyValue = value ? parseInt(value) : 0;
                  setUserLivingCost(weeklyValue);

                  // Convert weekly living cost to the current period format and update scenario
                  let updatedOwnersReturn = weeklyValue;
                  switch (period) {
                    case 'Weekly':
                      updatedOwnersReturn = weeklyValue;
                      break;
                    case 'Monthly':
                      updatedOwnersReturn = weeklyValue * 4.33;
                      break;
                    case 'Yearly':
                      updatedOwnersReturn = weeklyValue * 52;
                      break;
                  }

                  // Update the scenario's ownersReturn value
                  if (project.detailedBreakEven) {
                    onUpdate({
                      detailedBreakEven: {
                        ...project.detailedBreakEven,
                        scenario1: {
                          ...project.detailedBreakEven.scenario1,
                          ownersReturn: updatedOwnersReturn
                        }
                      }
                    });
                  }
                }}
                className="mt-1 bg-background"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Expected Opening Date</Label>
              <Input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="mt-1 bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {weeksUntilOwnerReturn > 26 && (
        <Alert className="bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            <strong>Extended break-even timeline.</strong> It will take more than 6 months to reach
            owner's return break-even. Consider speaking with a finance broker about bridging finance
            or income support options.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                {salesTargetMeaning === 'steady_weekly_target' ? 'Forecast mode: Steady weekly target' : 'Forecast mode: Annual total target'}
              </Badge>
              {salesTargetMeaning === 'steady_weekly_target' ? (
                <div className="text-xs text-muted-foreground">
                  Target weekly sales: {formatCurrency(expectedWeeklySales)} • Ramp duration: {rampWeeks} weeks
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Annual target sales: {formatCurrency(expectedWeeklySales * 52)} • Average weekly sales: {formatCurrency(expectedWeeklySales)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="include-owners" className="text-sm text-muted-foreground">
                  Include owners contribution
                </Label>
                <Switch
                  id="include-owners"
                  checked={includeOwnersReturn}
                  onCheckedChange={setIncludeOwnersReturn}
                />
              </div>
              <Select value={viewMode} onValueChange={(v: 'weekly' | 'monthly') => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <CardTitle className="text-right">Revenue Forecast</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative border rounded-md" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="w-full caption-bottom text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b-2 border-border">
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">{viewMode === 'weekly' ? 'Week' : 'Month'}</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Period</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Revenue</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">COGS</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Labour</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-1 cursor-help">
                            {includeOwnersReturn ? 'Fixed Costs' : 'Rent'}
                            {includeOwnersReturn && <HelpCircle className="h-3 w-3" />}
                          </div>
                        </TooltipTrigger>
                        {includeOwnersReturn && (
                          <TooltipContent>
                            <p>Fixed Costs = Rent + Owners' Contribution</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Aggregator Fees</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Net Profit</th>
                  <th className="bg-card font-semibold text-foreground text-center p-2 h-10 align-middle sticky top-0 z-10">Cumulative</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {predictions.map((row, index) => (
                  <tr key={index} className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                    row.isOwnerReturnBreakEven
                      ? 'bg-success/10 hover:bg-success/20'
                      : row.isOperatingBreakEven
                      ? 'bg-info/10 hover:bg-info/20'
                      : ''
                  }`}>
                    <td className="p-2 align-middle font-medium">
                      {viewMode === 'weekly' ? row.weekNumber : row.monthNumber}
                      {row.isOwnerReturnBreakEven && (
                        <Badge className="ml-2 bg-success text-success-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Owner Return BE
                        </Badge>
                      )}
                      {row.isOperatingBreakEven && !row.isOwnerReturnBreakEven && (
                        <Badge className="ml-2 bg-info text-info-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Operating BE
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 align-middle text-sm text-muted-foreground">{row.period}</td>
                    <td className="p-2 align-middle text-right">${row.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-2 align-middle text-right">${row.cogs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-2 align-middle text-right">${row.labour.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-2 align-middle text-right">${row.fixedCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-2 align-middle text-right">${row.aggregatorFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className={`p-2 align-middle text-right font-medium ${row.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${row.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className={`p-2 align-middle text-right font-medium ${row.cumulativeProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${row.cumulativeProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
                {predictions.length > 0 && (
                  <tr className="bg-muted font-semibold border-t-2 border-border">
                    <td colSpan={2} className="p-2 align-middle font-bold text-foreground">Totals</td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.revenue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.cogs, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.labour, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.fixedCosts, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.aggregatorFees, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      ${predictions.reduce((sum, row) => sum + row.netProfit, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 align-middle text-right text-foreground">
                      {predictions.length > 0 && predictions[predictions.length - 1].cumulativeProfit !== undefined
                        ? `$${predictions[predictions.length - 1].cumulativeProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '—'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.SALES_PREDICTIONS}
          onNavigate={onNavigate}
          onUpdate={handleNavigation}
          showPrevious={true}
        />
      )}
    </div>
  );
}
