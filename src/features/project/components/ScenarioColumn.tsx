import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Trash2, Info } from 'lucide-react';
import { calculateRequiredSales, formatCurrency, formatPercentage } from '@/lib/calculations';

interface CustomFixedCost {
  id: string;
  name: string;
  value: number;
}

export interface ScenarioData {
  enteredSales: number;
  ownersReturn: number;
  rent: number;
  labourMinimumCost: number;
  variableCogs: number;
  variableLabour: number;
  variableOther: number;
  insurance: number;
  accounting: number;
  marketing: number;
  utilities: number;
  otherFixed: number;
  customFixedCosts?: CustomFixedCost[];
  isFranchise?: boolean;
  franchiseName?: string;
  franchiseRoyaltyPercent?: number;
  franchiseMarketingPercent?: number;
  rentTurnoverEnabled?: boolean;
  rentTurnoverPercent?: number;
  rentTurnoverSettlement?: 'quarterly' | 'monthly' | 'annual';
}

interface ScenarioColumnProps {
  scenarioNumber: number;
  data: ScenarioData;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: ScenarioData) => void;
  onDeleteCustomCost?: (id: string) => void;
  fixedCostsOnly?: boolean;
  variableCostsOnly?: boolean;
}

export function ScenarioColumn({ scenarioNumber, data, period, onUpdate, onDeleteCustomCost, fixedCostsOnly, variableCostsOnly }: ScenarioColumnProps) {
  const customFixedCosts = data.customFixedCosts || [];

  // Convert all entered values to monthly base for calculations
  const rentMonthlyBase = period === 'Weekly' ? (data.rent * 52 / 12) : period === 'Yearly' ? (data.rent / 12) : data.rent;
  const ownersReturnMonthlyBase = period === 'Weekly' ? (data.ownersReturn * 52 / 12) : period === 'Yearly' ? (data.ownersReturn / 12) : data.ownersReturn;
  const labourMinimumMonthly = period === 'Weekly' ? (data.labourMinimumCost * 52 / 12) : period === 'Yearly' ? (data.labourMinimumCost / 12) : data.labourMinimumCost;
  const expectedSalesMonthly = period === 'Weekly' ? (data.enteredSales * 52 / 12) : period === 'Yearly' ? (data.enteredSales / 12) : data.enteredSales;
  const customFixedTotalMonthly = customFixedCosts.reduce((sum, cost) => {
    const costMonthly = period === 'Weekly' ? (cost.value * 52 / 12) : period === 'Yearly' ? (cost.value / 12) : cost.value;
    return sum + costMonthly;
  }, 0);

  // Convert standard fixed costs to monthly
  const insuranceMonthly = period === 'Weekly' ? (data.insurance * 52 / 12) : period === 'Yearly' ? (data.insurance / 12) : data.insurance;
  const accountingMonthly = period === 'Weekly' ? (data.accounting * 52 / 12) : period === 'Yearly' ? (data.accounting / 12) : data.accounting;
  const marketingMonthly = period === 'Weekly' ? (data.marketing * 52 / 12) : period === 'Yearly' ? (data.marketing / 12) : data.marketing;
  const utilitiesMonthly = period === 'Weekly' ? (data.utilities * 52 / 12) : period === 'Yearly' ? (data.utilities / 12) : data.utilities;
  const otherFixedMonthly = period === 'Weekly' ? (data.otherFixed * 52 / 12) : period === 'Yearly' ? (data.otherFixed / 12) : data.otherFixed;

  // Calculate labour cost based on sales
  const calculatedLabourDollar = (expectedSalesMonthly * data.variableLabour) / 100;
  const useLabourMinimum = calculatedLabourDollar < labourMinimumMonthly;

  const effectiveLabourVariable = useLabourMinimum ? 0 : data.variableLabour;
  const effectiveLabourFixed = useLabourMinimum ? labourMinimumMonthly : 0;

  // Turnover rent calculations
  const rentTurnoverEnabled = data.rentTurnoverEnabled ?? false;
  const rentTurnoverPercent = data.rentTurnoverPercent ?? 0;
  const expectedSalesAnnual = expectedSalesMonthly * 12;

  let effectiveRentMonthly = rentMonthlyBase;
  let effectiveRentAnnual = rentMonthlyBase * 12;
  let rentVariablePercent = 0;
  let effectiveRentFixed = rentMonthlyBase;

  if (rentTurnoverEnabled) {
    const baseAnnualRent = rentMonthlyBase * 12;
    const turnoverRate = rentTurnoverPercent / 100;
    const turnoverAnnualRent = expectedSalesAnnual * turnoverRate;
    effectiveRentAnnual = Math.max(baseAnnualRent, turnoverAnnualRent);

    effectiveRentMonthly = effectiveRentAnnual / 12;

    // Split into fixed (base) and variable components
    const fixedRentAnnual = baseAnnualRent;
    const variableRentAnnual = Math.max(0, turnoverAnnualRent - baseAnnualRent);
    rentVariablePercent = expectedSalesAnnual > 0 ? (variableRentAnnual / expectedSalesAnnual) * 100 : 0;

    effectiveRentFixed = fixedRentAnnual / 12;
  }

  const franchiseRoyalty = data.isFranchise ? (data.franchiseRoyaltyPercent ?? 0) : 0;
  const franchiseMarketing = data.isFranchise ? (data.franchiseMarketingPercent ?? 0) : 0;
  const totalFranchiseFees = franchiseRoyalty + franchiseMarketing;

  const totalVariable = data.variableCogs + effectiveLabourVariable + data.variableOther + totalFranchiseFees + rentVariablePercent;
  const fixedCostsMonthly = effectiveRentFixed + effectiveLabourFixed + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;

  // For break-even calculations, always use minimum labour as fixed cost
  // because at low sales (break-even level), you're paying minimum labour not variable labour
  const fixedCostsForBreakEven = effectiveRentFixed + labourMinimumMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;
  const totalVariableForBreakEven = data.variableCogs + data.variableOther + totalFranchiseFees + rentVariablePercent;

  const breakEvenSales = calculateRequiredSales(fixedCostsForBreakEven, 0, totalVariableForBreakEven);
  const requiredSalesWithOwner = calculateRequiredSales(fixedCostsForBreakEven, ownersReturnMonthlyBase, totalVariableForBreakEven);
  const variableCostsDollar = ((fixedCostsMonthly + ownersReturnMonthlyBase) / (1 - totalVariable / 100)) * (totalVariable / 100);

  // Convert values for display based on period
  const fixedCostsDisplay = period === 'Weekly' ? (fixedCostsMonthly * 12 / 52) : period === 'Yearly' ? (fixedCostsMonthly * 12) : fixedCostsMonthly;
  const variableCostsDollarDisplay = period === 'Weekly' ? (variableCostsDollar * 12 / 52) : period === 'Yearly' ? (variableCostsDollar * 12) : variableCostsDollar;
  const breakEvenSalesDisplay = period === 'Weekly' ? (breakEvenSales * 12 / 52) : period === 'Yearly' ? (breakEvenSales * 12) : breakEvenSales;
  const requiredSalesWithOwnerDisplay = period === 'Weekly' ? (requiredSalesWithOwner * 12 / 52) : period === 'Yearly' ? (requiredSalesWithOwner * 12) : requiredSalesWithOwner;

  const hasError = totalVariable >= 100;
  const hasWarning = !hasError && requiredSalesWithOwner > data.enteredSales;

  const handleCurrencyChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const formatInputCurrency = (value: number): string => {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handlePercentageChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const formatInputPercentage = (value: number): string => {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleDeleteCustomCost = (id: string) => {
    if (onDeleteCustomCost) {
      onDeleteCustomCost(id);
    } else {
      onUpdate({
        ...data,
        customFixedCosts: customFixedCosts.filter(cost => cost.id !== id),
      });
    }
  };

  const handleCustomCostChange = (id: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({
      ...data,
      customFixedCosts: customFixedCosts.map(cost =>
        cost.id === id ? { ...cost, value: parseFloat(numericValue) || 0 } : cost
      ),
    });
  };

  if (fixedCostsOnly) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">Scenario {scenarioNumber}</h3>

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Occupancy Costs</CardTitle>
            <CardDescription className="text-xs">Costs associated with occupying the premises</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`rent-${scenarioNumber}`} className="text-sm">Base Rent ({period})</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`rent-turnover-${scenarioNumber}`} className="text-xs text-foreground font-bold">% Rent</Label>
                  <Switch
                    id={`rent-turnover-${scenarioNumber}`}
                    checked={rentTurnoverEnabled}
                    onCheckedChange={(checked) => onUpdate({ ...data, rentTurnoverEnabled: checked })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-[0.775]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id={`rent-${scenarioNumber}`}
                    type="text"
                    className="pl-7 h-9 text-sm"
                    value={formatInputCurrency(data.rent)}
                    onChange={(e) => handleCurrencyChange('rent', e.target.value)}
                  />
                </div>
                <div className="relative flex-[0.225]">
                  <Input
                    id={`rent-turnover-percent-${scenarioNumber}`}
                    type="text"
                    className={`pr-7 h-9 text-sm ${!rentTurnoverEnabled ? 'bg-muted text-muted-foreground/40 cursor-not-allowed disabled:opacity-100 border-border/50' : ''}`}
                    value={formatInputPercentage(rentTurnoverPercent)}
                    onChange={(e) => handlePercentageChange('rentTurnoverPercent', e.target.value)}
                    disabled={!rentTurnoverEnabled}
                  />
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${!rentTurnoverEnabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Turnover rent applies when the percentage of sales is higher than the base rent. Base rent can be $0 if required.
              </p>
              {rentTurnoverEnabled && (
                <div className="pl-4 space-y-2 border-l-2 border-info/30">
                  {data.enteredSales === 0 && (
                    <Alert className="border-warning/30 bg-warning/10 py-2">
                      <AlertTriangle className="h-3 w-3 !text-warning" />
                      <AlertDescription className="text-[10px]">
                        Turnover rent needs Expected Sales ({period}) to calculate accurately. Enter it in Revenue & Targets below.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Labour Costs</CardTitle>
            <CardDescription className="text-xs">Staffing costs split into fixed and variable components</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`labourMinimumCost-${scenarioNumber}`} className="text-sm">Minimum Labour $ ({period})</Label>
                <Label htmlFor={`variableLabour-${scenarioNumber}`} className="text-xs text-foreground font-bold">Labour Variable %</Label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-[0.775]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id={`labourMinimumCost-${scenarioNumber}`}
                    type="text"
                    className="pl-7 h-9 text-sm"
                    value={formatInputCurrency(data.labourMinimumCost)}
                    onChange={(e) => handleCurrencyChange('labourMinimumCost', e.target.value)}
                  />
                </div>
                <div className="relative flex-[0.225]">
                  <Input
                    id={`variableLabour-${scenarioNumber}`}
                    type="text"
                    className="pr-7 h-9 text-sm"
                    value={formatInputPercentage(data.variableLabour)}
                    onChange={(e) => handlePercentageChange('variableLabour', e.target.value)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Minimum staffing that must be paid regardless of sales. Variable % scales with revenue.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Fixed Costs</CardTitle>
            <CardDescription className="text-xs">Other overheads per {period.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label htmlFor={`insurance-${scenarioNumber}`} className="text-sm">Insurance ({period})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`insurance-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.insurance)}
                  onChange={(e) => handleCurrencyChange('insurance', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`accounting-${scenarioNumber}`} className="text-sm">Accounting ({period})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`accounting-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.accounting)}
                  onChange={(e) => handleCurrencyChange('accounting', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`marketing-${scenarioNumber}`} className="text-sm">Marketing ({period})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`marketing-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.marketing)}
                  onChange={(e) => handleCurrencyChange('marketing', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`utilities-${scenarioNumber}`} className="text-sm">Utilities ({period})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`utilities-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.utilities)}
                  onChange={(e) => handleCurrencyChange('utilities', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`otherFixed-${scenarioNumber}`} className="text-sm">Other Fixed ({period})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`otherFixed-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.otherFixed)}
                  onChange={(e) => handleCurrencyChange('otherFixed', e.target.value)}
                />
              </div>
            </div>
            {customFixedCosts.map((cost) => (
              <div key={cost.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`${cost.id}-${scenarioNumber}`} className="text-sm">{cost.name} ({period})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id={`${cost.id}-${scenarioNumber}`}
                      type="text"
                      className="pl-7 h-9 text-sm"
                      value={formatInputCurrency(cost.value)}
                      onChange={(e) => handleCustomCostChange(cost.id, e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleDeleteCustomCost(cost.id)}
                  title="Delete this cost"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variableCostsOnly) {
    return (
      <div className="space-y-4">
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Variable costs total {formatPercentage(totalVariable)}. This must be less than 100% for the business to be viable.
            </AlertDescription>
          </Alert>
        )}

        {hasWarning && (
          <Alert className="border-warning/30 bg-warning/10">
            <AlertTriangle className="h-4 w-4 !text-warning" />
            <AlertDescription>
              Required sales ({formatCurrency(requiredSalesWithOwner)}) exceed entered sales ({formatCurrency(data.enteredSales)}).
              Your business may not be viable at this sales level.
            </AlertDescription>
          </Alert>
        )}

        <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Variable Costs</CardTitle>
          <CardDescription className="text-xs">Enter your variable costs as percentages of sales</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label htmlFor={`variableCogs-${scenarioNumber}`} className="text-sm">COGS %</Label>
            <div className="relative">
              <Input
                id={`variableCogs-${scenarioNumber}`}
                type="text"
                className="pr-7 h-9 text-sm"
                value={formatInputPercentage(data.variableCogs)}
                onChange={(e) => handlePercentageChange('variableCogs', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div>
            <Label htmlFor={`variableOther-${scenarioNumber}`} className="text-sm">Other Variable %</Label>
            <div className="relative">
              <Input
                id={`variableOther-${scenarioNumber}`}
                type="text"
                className="pr-7 h-9 text-sm"
                value={formatInputPercentage(data.variableOther)}
                onChange={(e) => handlePercentageChange('variableOther', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Labour:</span>
              <span className="font-medium">
                {formatPercentage(effectiveLabourVariable)}
                {useLabourMinimum && (
                  <span className="text-xs text-info font-medium ml-2">
                    (Using Min Cost)
                  </span>
                )}
              </span>
            </div>
            {data.isFranchise && totalFranchiseFees > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Franchise Royalty:</span>
                  <span className="font-medium">{formatPercentage(franchiseRoyalty)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Franchise Marketing:</span>
                  <span className="font-medium">{formatPercentage(franchiseMarketing)}</span>
                </div>
              </>
            )}
            {rentVariablePercent > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Turnover Rent:</span>
                <span className="font-medium">{formatPercentage(rentVariablePercent)}</span>
              </div>
            )}
          </div>
          <div className="text-right font-semibold text-sm pt-2 border-t">
            Total Variable: {formatPercentage(totalVariable)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Revenue & Targets</CardTitle>
          <CardDescription className="text-xs">Enter your expected sales and desired owner's return</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label htmlFor={`enteredSales-${scenarioNumber}`} className="text-sm">Expected Sales ({period})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id={`enteredSales-${scenarioNumber}`}
                type="text"
                className="pl-7 h-9 text-sm"
                value={formatInputCurrency(data.enteredSales)}
                onChange={(e) => handleCurrencyChange('enteredSales', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`ownersReturn-${scenarioNumber}`} className="text-sm">Owner's Return ({period})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id={`ownersReturn-${scenarioNumber}`}
                type="text"
                className="pl-7 h-9 text-sm"
                value={formatInputCurrency(data.ownersReturn)}
                onChange={(e) => handleCurrencyChange('ownersReturn', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-info/30">
        <CardHeader className="bg-info/10 rounded-t-lg">
          <CardTitle className="text-base">Break-Even Results</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Fixed Costs:
                {useLabourMinimum && (
                  <span className="text-[10px] text-info font-semibold">(incl. Labour)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(fixedCostsDisplay)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Total Variable %:
                {!useLabourMinimum && (
                  <span className="text-[10px] text-info font-semibold">(incl. Labour)</span>
                )}
                {rentVariablePercent > 0 && (
                  <span className="text-[10px] text-info font-semibold">(incl. %Rent)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatPercentage(totalVariable)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Variable Costs $:
                {rentVariablePercent > 0 && (
                  <span className="text-[10px] text-info font-semibold">(incl. %Rent)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(variableCostsDollarDisplay)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs">Required Sales to Break-Even:</span>
              <span className="text-sm font-semibold">
                {hasError ? 'Invalid' : formatCurrency(breakEvenSalesDisplay)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">
              <span className="font-bold text-xs">Required Sales to Pay the Owner:</span>
              <span className="text-base font-bold text-info">
                {hasError ? 'Invalid' : formatCurrency(requiredSalesWithOwnerDisplay)}
              </span>
            </div>
            {!hasError && (
              <div className="p-3 bg-surface-2 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs">
                      {data.enteredSales >= requiredSalesWithOwnerDisplay
                        ? 'Surplus (Not Profit)'
                        : 'Shortfall'}
                    </span>
                    <Info className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                  <span className={`text-sm font-semibold ${data.enteredSales >= requiredSalesWithOwnerDisplay ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(data.enteredSales - requiredSalesWithOwnerDisplay))}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {data.enteredSales >= requiredSalesWithOwnerDisplay
                    ? 'Above minimum break-even revenue'
                    : 'Below minimum break-even revenue'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {rentTurnoverEnabled && (
        <Card className="border-2 border-brand/30">
          <CardHeader className="bg-brand/5 rounded-t-lg">
            <CardTitle className="text-base">Turnover Rent Insights</CardTitle>
            <CardDescription className="text-xs">Analysis of your turnover rent structure</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs">Effective Rent ({period}):</span>
              <span className="text-sm font-semibold">{formatCurrency(period === 'Weekly' ? effectiveRentAnnual / 52 : period === 'Monthly' ? effectiveRentMonthly : effectiveRentAnnual)}</span>
            </div>
            {expectedSalesAnnual > 0 && (
              <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
                <span className="font-medium text-xs">Effective Rent % of Sales (Annual):</span>
                <span className="text-sm font-semibold">{formatPercentage((effectiveRentAnnual / expectedSalesAnnual) * 100)}</span>
              </div>
            )}

            {expectedSalesAnnual > 0 && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold mb-2">Rent Sensitivity:</p>
                  <div className="space-y-1">
                    {[0.8, 1.0, 1.2].map((multiplier) => {
                      const sensitivitySales = expectedSalesAnnual * multiplier;
                      const sensitivityTurnoverRent = sensitivitySales * (rentTurnoverPercent / 100);
                      const sensitivityBaseRent = rentMonthlyBase * 12;
                      const sensitivityEffectiveRent = Math.max(sensitivityBaseRent, sensitivityTurnoverRent);
                      const rentPercent = (sensitivityEffectiveRent / sensitivitySales) * 100;

                      return (
                        <div key={multiplier} className="flex justify-between items-center p-2 bg-surface-2 rounded text-[10px]">
                          <span className="text-muted-foreground">
                            {multiplier === 1.0 ? 'At Expected Sales' : `At ${(multiplier * 100).toFixed(0)}% of Expected`}:
                          </span>
                          <div className="flex gap-2">
                            <span className="font-medium">{formatCurrency(sensitivityEffectiveRent / 12)}/mo</span>
                            <span className="text-muted-foreground">({formatPercentage(rentPercent)})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {((effectiveRentAnnual / expectedSalesAnnual) * 100) > 10 && (
                  <Alert className={`${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'border-destructive/30 bg-destructive/10' : 'border-warning/30 bg-warning/10'} py-2`}>
                    <AlertTriangle className={`h-3 w-3 ${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'text-destructive' : '!text-warning'}`} />
                    <AlertDescription className={`text-[10px] ${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'text-destructive' : ''}`}>
                      {((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12
                        ? 'Rent looks high vs sales (over 12%).'
                        : 'Rent looks high vs sales (over 10%).'}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variable costs total {formatPercentage(totalVariable)}. This must be less than 100% for the business to be viable.
          </AlertDescription>
        </Alert>
      )}

      {hasWarning && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTriangle className="h-4 w-4 !text-warning" />
          <AlertDescription>
            Required sales ({formatCurrency(requiredSalesWithOwner)}) exceed entered sales ({formatCurrency(data.enteredSales)}).
            Your business may not be viable at this sales level.
          </AlertDescription>
        </Alert>
      )}

      <h3 className="text-xl font-bold text-center">Scenario {scenarioNumber}</h3>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Fixed Costs</CardTitle>
          <CardDescription className="text-xs">Enter your fixed costs per {period.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`rent-full-${scenarioNumber}`} className="text-sm">Rent ({period})</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor={`rent-turnover-full-${scenarioNumber}`} className="text-xs text-foreground font-bold">% Rent</Label>
                <Switch
                  id={`rent-turnover-full-${scenarioNumber}`}
                  checked={rentTurnoverEnabled}
                  onCheckedChange={(checked) => onUpdate({ ...data, rentTurnoverEnabled: checked })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-[0.55]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={`rent-full-${scenarioNumber}`}
                  type="text"
                  className="pl-7 h-9 text-sm"
                  value={formatInputCurrency(data.rent)}
                  onChange={(e) => handleCurrencyChange('rent', e.target.value)}
                />
              </div>
              <div className="relative flex-[0.45]">
                <Input
                  id={`rent-turnover-percent-full-${scenarioNumber}`}
                  type="text"
                  className={`pr-7 h-9 text-sm ${!rentTurnoverEnabled ? 'bg-muted text-muted-foreground/40 cursor-not-allowed' : ''}`}
                  value={formatInputPercentage(rentTurnoverPercent)}
                  onChange={(e) => handlePercentageChange('rentTurnoverPercent', e.target.value)}
                  disabled={!rentTurnoverEnabled}
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${!rentTurnoverEnabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Turnover rent applies when the percentage of sales is higher than the base rent. Base rent can be $0 if required.
            </p>
            {rentTurnoverEnabled && (
              <div className="pl-4 space-y-2 border-l-2 border-info/30">
                {data.enteredSales === 0 && (
                  <Alert className="border-warning/30 bg-warning/10 py-2">
                    <AlertTriangle className="h-3 w-3 !text-warning" />
                    <AlertDescription className="text-[10px]">
                      Turnover rent needs Expected Sales ({period}) to calculate accurately. Enter it in Revenue & Targets below.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor={`labourMinimumCost-${scenarioNumber}`} className="text-sm">Minimum Labour $ ({period})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id={`labourMinimumCost-${scenarioNumber}`}
                type="text"
                className="pl-7 h-9 text-sm"
                value={formatInputCurrency(data.labourMinimumCost)}
                onChange={(e) => handleCurrencyChange('labourMinimumCost', e.target.value)}
              />
            </div>
          </div>
          {customFixedCosts.map((cost) => (
            <div key={cost.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor={`${cost.id}-${scenarioNumber}`} className="text-sm">{cost.name} ({period})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id={`${cost.id}-${scenarioNumber}`}
                    type="text"
                    className="pl-7 h-9 text-sm"
                    value={formatInputCurrency(cost.value)}
                    onChange={(e) => handleCustomCostChange(cost.id, e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleDeleteCustomCost(cost.id)}
                title="Delete this cost"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Variable Costs</CardTitle>
          <CardDescription className="text-xs">Enter your variable costs as percentages of sales</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label htmlFor={`variableCogs-${scenarioNumber}`} className="text-sm">COGS</Label>
            <div className="relative">
              <Input
                id={`variableCogs-${scenarioNumber}`}
                type="text"
                className="pr-7 h-9 text-sm"
                value={formatInputPercentage(data.variableCogs)}
                onChange={(e) => handlePercentageChange('variableCogs', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div>
            <Label htmlFor={`variableLabour-${scenarioNumber}`} className="text-sm">
              Labour
              {useLabourMinimum && (
                <span className="text-xs text-info font-medium ml-2">
                  (Using Min Cost)
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id={`variableLabour-${scenarioNumber}`}
                type="text"
                className="pr-7 h-9 text-sm"
                value={formatInputPercentage(data.variableLabour)}
                onChange={(e) => handlePercentageChange('variableLabour', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div>
            <Label htmlFor={`variableOther-${scenarioNumber}`} className="text-sm">Other</Label>
            <div className="relative">
              <Input
                id={`variableOther-${scenarioNumber}`}
                type="text"
                className="pr-7 h-9 text-sm"
                value={formatInputPercentage(data.variableOther)}
                onChange={(e) => handlePercentageChange('variableOther', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          {data.isFranchise && totalFranchiseFees > 0 && (
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Franchise Royalty:</span>
                <span className="font-medium">{formatPercentage(franchiseRoyalty)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Franchise Marketing:</span>
                <span className="font-medium">{formatPercentage(franchiseMarketing)}</span>
              </div>
            </div>
          )}
          <div className="text-right font-semibold text-sm">
            Total Variable: {formatPercentage(totalVariable)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Revenue & Targets</CardTitle>
          <CardDescription className="text-xs">Enter your expected sales and desired owner's return</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label htmlFor={`enteredSales-${scenarioNumber}`} className="text-sm">Expected Sales ({period})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id={`enteredSales-${scenarioNumber}`}
                type="text"
                className="pl-7 h-9 text-sm"
                value={formatInputCurrency(data.enteredSales)}
                onChange={(e) => handleCurrencyChange('enteredSales', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`ownersReturn-${scenarioNumber}`} className="text-sm">Owner's Return ({period})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id={`ownersReturn-${scenarioNumber}`}
                type="text"
                className="pl-7 h-9 text-sm"
                value={formatInputCurrency(data.ownersReturn)}
                onChange={(e) => handleCurrencyChange('ownersReturn', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-info/30">
        <CardHeader className="bg-info/10 rounded-t-lg">
          <CardTitle className="text-base">Break-Even Results</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Fixed Costs:
                {useLabourMinimum && (
                  <span className="text-[10px] text-info font-semibold">(incl. Labour)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(fixedCostsDisplay)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Total Variable %:
                {!useLabourMinimum && (
                  <span className="text-[10px] text-info font-semibold">(incl. Labour)</span>
                )}
                {rentVariablePercent > 0 && (
                  <span className="text-[10px] text-info font-semibold">(incl. %Rent)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatPercentage(totalVariable)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs flex items-center gap-1">
                Variable Costs $:
                {rentVariablePercent > 0 && (
                  <span className="text-[10px] text-info font-semibold">(incl. %Rent)</span>
                )}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(variableCostsDollarDisplay)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs">Required Sales to Break-Even:</span>
              <span className="text-sm font-semibold">
                {hasError ? 'Invalid' : formatCurrency(breakEvenSalesDisplay)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">
              <span className="font-bold text-xs">Required Sales to Pay the Owner:</span>
              <span className="text-base font-bold text-info">
                {hasError ? 'Invalid' : formatCurrency(requiredSalesWithOwnerDisplay)}
              </span>
            </div>
            {!hasError && (
              <div className="p-3 bg-surface-2 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs">
                      {data.enteredSales >= requiredSalesWithOwnerDisplay
                        ? 'Surplus (Not Profit)'
                        : 'Shortfall'}
                    </span>
                    <Info className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                  <span className={`text-sm font-semibold ${data.enteredSales >= requiredSalesWithOwnerDisplay ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(data.enteredSales - requiredSalesWithOwnerDisplay))}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {data.enteredSales >= requiredSalesWithOwnerDisplay
                    ? 'Above minimum break-even revenue'
                    : 'Below minimum break-even revenue'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {rentTurnoverEnabled && (
        <Card className="border-2 border-brand/30">
          <CardHeader className="bg-brand/5 rounded-t-lg">
            <CardTitle className="text-base">Turnover Rent Insights</CardTitle>
            <CardDescription className="text-xs">Analysis of your turnover rent structure</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
              <span className="font-medium text-xs">Effective Rent ({period}):</span>
              <span className="text-sm font-semibold">{formatCurrency(period === 'Weekly' ? effectiveRentAnnual / 52 : period === 'Monthly' ? effectiveRentMonthly : effectiveRentAnnual)}</span>
            </div>
            {expectedSalesAnnual > 0 && (
              <div className="flex justify-between items-center p-2 bg-surface-2 rounded">
                <span className="font-medium text-xs">Effective Rent % of Sales (Annual):</span>
                <span className="text-sm font-semibold">{formatPercentage((effectiveRentAnnual / expectedSalesAnnual) * 100)}</span>
              </div>
            )}

            {expectedSalesAnnual > 0 && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold mb-2">Rent Sensitivity:</p>
                  <div className="space-y-1">
                    {[0.8, 1.0, 1.2].map((multiplier) => {
                      const sensitivitySales = expectedSalesAnnual * multiplier;
                      const sensitivityTurnoverRent = sensitivitySales * (rentTurnoverPercent / 100);
                      const sensitivityBaseRent = rentMonthlyBase * 12;
                      const sensitivityEffectiveRent = Math.max(sensitivityBaseRent, sensitivityTurnoverRent);
                      const rentPercent = (sensitivityEffectiveRent / sensitivitySales) * 100;

                      return (
                        <div key={multiplier} className="flex justify-between items-center p-2 bg-surface-2 rounded text-[10px]">
                          <span className="text-muted-foreground">
                            {multiplier === 1.0 ? 'At Expected Sales' : `At ${(multiplier * 100).toFixed(0)}% of Expected`}:
                          </span>
                          <div className="flex gap-2">
                            <span className="font-medium">{formatCurrency(sensitivityEffectiveRent / 12)}/mo</span>
                            <span className="text-muted-foreground">({formatPercentage(rentPercent)})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {((effectiveRentAnnual / expectedSalesAnnual) * 100) > 10 && (
                  <Alert className={`${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'border-destructive/30 bg-destructive/10' : 'border-warning/30 bg-warning/10'} py-2`}>
                    <AlertTriangle className={`h-3 w-3 ${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'text-destructive' : '!text-warning'}`} />
                    <AlertDescription className={`text-[10px] ${((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12 ? 'text-destructive' : ''}`}>
                      {((effectiveRentAnnual / expectedSalesAnnual) * 100) > 12
                        ? 'Rent looks high vs sales (over 12%).'
                        : 'Rent looks high vs sales (over 10%).'}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
