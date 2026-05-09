import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ScenarioData } from './ScenarioColumn';
import { formatCurrency } from '@/lib/calculations';
import { calculateRequiredSales } from '@/lib/calculations';

interface ScenarioSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario1: ScenarioData;
  scenario2: ScenarioData;
  scenario3: ScenarioData;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  currentSelection?: 1 | 2 | 3 | null;
  onConfirm: (scenarioNumber: 1 | 2 | 3) => void;
}

type ViabilityStatus = 'Likely Viable' | 'Possibly Viable' | 'Not Viable' | 'Severely Not Viable';

function calculateScenarioViability(scenarioData: ScenarioData, period: 'Weekly' | 'Monthly' | 'Yearly'): ViabilityStatus {
  const rentMonthlyBase = period === 'Weekly' ? (scenarioData.rent * 52 / 12) : period === 'Yearly' ? (scenarioData.rent / 12) : scenarioData.rent;
  const ownersReturnMonthlyBase = period === 'Weekly' ? (scenarioData.ownersReturn * 52 / 12) : period === 'Yearly' ? (scenarioData.ownersReturn / 12) : scenarioData.ownersReturn;
  const labourMinimumMonthly = period === 'Weekly' ? (scenarioData.labourMinimumCost * 52 / 12) : period === 'Yearly' ? (scenarioData.labourMinimumCost / 12) : scenarioData.labourMinimumCost;
  const expectedSalesMonthly = period === 'Weekly' ? (scenarioData.enteredSales * 52 / 12) : period === 'Yearly' ? (scenarioData.enteredSales / 12) : scenarioData.enteredSales;

  const customFixedCosts = scenarioData.customFixedCosts || [];
  const customFixedTotalMonthly = customFixedCosts.reduce((sum, cost) => {
    const costMonthly = period === 'Weekly' ? (cost.value * 52 / 12) : period === 'Yearly' ? (cost.value / 12) : cost.value;
    return sum + costMonthly;
  }, 0);

  const insuranceMonthly = period === 'Weekly' ? (scenarioData.insurance * 52 / 12) : period === 'Yearly' ? (scenarioData.insurance / 12) : scenarioData.insurance;
  const accountingMonthly = period === 'Weekly' ? (scenarioData.accounting * 52 / 12) : period === 'Yearly' ? (scenarioData.accounting / 12) : scenarioData.accounting;
  const marketingMonthly = period === 'Weekly' ? (scenarioData.marketing * 52 / 12) : period === 'Yearly' ? (scenarioData.marketing / 12) : scenarioData.marketing;
  const utilitiesMonthly = period === 'Weekly' ? (scenarioData.utilities * 52 / 12) : period === 'Yearly' ? (scenarioData.utilities / 12) : scenarioData.utilities;
  const otherFixedMonthly = period === 'Weekly' ? (scenarioData.otherFixed * 52 / 12) : period === 'Yearly' ? (scenarioData.otherFixed / 12) : scenarioData.otherFixed;

  const rentTurnoverEnabled = scenarioData.rentTurnoverEnabled ?? false;
  const rentTurnoverPercent = scenarioData.rentTurnoverPercent ?? 0;
  const expectedSalesAnnual = expectedSalesMonthly * 12;

  let effectiveRentFixed = rentMonthlyBase;
  let rentVariablePercent = 0;

  if (rentTurnoverEnabled) {
    const baseAnnualRent = rentMonthlyBase * 12;
    const turnoverRate = rentTurnoverPercent / 100;
    const turnoverAnnualRent = expectedSalesAnnual * turnoverRate;

    const fixedRentAnnual = baseAnnualRent;
    const variableRentAnnual = Math.max(0, turnoverAnnualRent - baseAnnualRent);
    rentVariablePercent = expectedSalesAnnual > 0 ? (variableRentAnnual / expectedSalesAnnual) * 100 : 0;

    effectiveRentFixed = fixedRentAnnual / 12;
  }

  const franchiseRoyalty = scenarioData.isFranchise ? (scenarioData.franchiseRoyaltyPercent ?? 0) : 0;
  const franchiseMarketing = scenarioData.isFranchise ? (scenarioData.franchiseMarketingPercent ?? 0) : 0;
  const totalFranchiseFees = franchiseRoyalty + franchiseMarketing;

  const totalVariable = scenarioData.variableCogs + scenarioData.variableLabour + scenarioData.variableOther + totalFranchiseFees + rentVariablePercent;

  const fixedCostsForBreakEven = effectiveRentFixed + labourMinimumMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;
  const totalVariableForBreakEven = scenarioData.variableCogs + scenarioData.variableOther + totalFranchiseFees + rentVariablePercent;

  const requiredSalesWithOwner = calculateRequiredSales(fixedCostsForBreakEven, ownersReturnMonthlyBase, totalVariableForBreakEven);

  const gapVsTarget = expectedSalesMonthly - requiredSalesWithOwner;
  const gapPercentage = expectedSalesMonthly > 0 ? (gapVsTarget / expectedSalesMonthly) * 100 : 0;

  if (totalVariable >= 100) {
    return 'Not Viable';
  }

  if (gapPercentage < -10) {
    return 'Severely Not Viable';
  }

  if (gapPercentage >= -10 && gapPercentage <= 10) {
    return 'Possibly Viable';
  }

  return 'Likely Viable';
}

function getScenarioMetrics(scenarioData: ScenarioData, period: 'Weekly' | 'Monthly' | 'Yearly') {
  const rentMonthlyBase = period === 'Weekly' ? (scenarioData.rent * 52 / 12) : period === 'Yearly' ? (scenarioData.rent / 12) : scenarioData.rent;
  const ownersReturnMonthlyBase = period === 'Weekly' ? (scenarioData.ownersReturn * 52 / 12) : period === 'Yearly' ? (scenarioData.ownersReturn / 12) : scenarioData.ownersReturn;
  const labourMinimumMonthly = period === 'Weekly' ? (scenarioData.labourMinimumCost * 52 / 12) : period === 'Yearly' ? (scenarioData.labourMinimumCost / 12) : scenarioData.labourMinimumCost;

  const customFixedCosts = scenarioData.customFixedCosts || [];
  const customFixedTotalMonthly = customFixedCosts.reduce((sum, cost) => {
    const costMonthly = period === 'Weekly' ? (cost.value * 52 / 12) : period === 'Yearly' ? (cost.value / 12) : cost.value;
    return sum + costMonthly;
  }, 0);

  const insuranceMonthly = period === 'Weekly' ? (scenarioData.insurance * 52 / 12) : period === 'Yearly' ? (scenarioData.insurance / 12) : scenarioData.insurance;
  const accountingMonthly = period === 'Weekly' ? (scenarioData.accounting * 52 / 12) : period === 'Yearly' ? (scenarioData.accounting / 12) : scenarioData.accounting;
  const marketingMonthly = period === 'Weekly' ? (scenarioData.marketing * 52 / 12) : period === 'Yearly' ? (scenarioData.marketing / 12) : scenarioData.marketing;
  const utilitiesMonthly = period === 'Weekly' ? (scenarioData.utilities * 52 / 12) : period === 'Yearly' ? (scenarioData.utilities / 12) : scenarioData.utilities;
  const otherFixedMonthly = period === 'Weekly' ? (scenarioData.otherFixed * 52 / 12) : period === 'Yearly' ? (scenarioData.otherFixed / 12) : scenarioData.otherFixed;

  const rentTurnoverEnabled = scenarioData.rentTurnoverEnabled ?? false;
  const rentTurnoverPercent = scenarioData.rentTurnoverPercent ?? 0;
  const expectedSalesMonthly = period === 'Weekly' ? (scenarioData.enteredSales * 52 / 12) : period === 'Yearly' ? (scenarioData.enteredSales / 12) : scenarioData.enteredSales;
  const expectedSalesAnnual = expectedSalesMonthly * 12;

  let effectiveRentFixed = rentMonthlyBase;
  let rentVariablePercent = 0;

  if (rentTurnoverEnabled) {
    const baseAnnualRent = rentMonthlyBase * 12;
    const turnoverRate = rentTurnoverPercent / 100;
    const turnoverAnnualRent = expectedSalesAnnual * turnoverRate;

    const fixedRentAnnual = baseAnnualRent;
    const variableRentAnnual = Math.max(0, turnoverAnnualRent - baseAnnualRent);
    rentVariablePercent = expectedSalesAnnual > 0 ? (variableRentAnnual / expectedSalesAnnual) * 100 : 0;

    effectiveRentFixed = fixedRentAnnual / 12;
  }

  const franchiseRoyalty = scenarioData.isFranchise ? (scenarioData.franchiseRoyaltyPercent ?? 0) : 0;
  const franchiseMarketing = scenarioData.isFranchise ? (scenarioData.franchiseMarketingPercent ?? 0) : 0;
  const totalFranchiseFees = franchiseRoyalty + franchiseMarketing;

  const fixedCostsForBreakEven = effectiveRentFixed + labourMinimumMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;
  const totalVariableForBreakEven = scenarioData.variableCogs + scenarioData.variableOther + totalFranchiseFees + rentVariablePercent;

  const requiredSalesWithOwner = calculateRequiredSales(fixedCostsForBreakEven, ownersReturnMonthlyBase, totalVariableForBreakEven);

  const requiredSalesDisplay = period === 'Weekly' ? (requiredSalesWithOwner * 12 / 52) : period === 'Yearly' ? (requiredSalesWithOwner * 12) : requiredSalesWithOwner;

  return {
    requiredSales: requiredSalesDisplay,
    targetSales: scenarioData.enteredSales,
  };
}

export function ScenarioSelectionDialog({
  open,
  onOpenChange,
  scenario1,
  scenario2,
  scenario3,
  period,
  currentSelection,
  onConfirm,
}: ScenarioSelectionDialogProps) {
  const [selectedScenario, setSelectedScenario] = useState<1 | 2 | 3 | null>(currentSelection || null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const scenarios = [
    { number: 1 as const, data: scenario1 },
    { number: 2 as const, data: scenario2 },
    { number: 3 as const, data: scenario3 },
  ];

  const handleConfirm = () => {
    if (selectedScenario) {
      onConfirm(selectedScenario);
      setShowConfirmation(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedScenario(currentSelection || null);
  };

  const getViabilityIcon = (status: ViabilityStatus) => {
    switch (status) {
      case 'Likely Viable':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'Possibly Viable':
        return <AlertTriangle className="h-5 w-5 text-warning-foreground" />;
      case 'Not Viable':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'Severely Not Viable':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getViabilityColor = (status: ViabilityStatus) => {
    switch (status) {
      case 'Likely Viable':
        return 'border-success/50 bg-success/10';
      case 'Possibly Viable':
        return 'border-warning/30 bg-warning/10';
      case 'Not Viable':
        return 'border-destructive/50 bg-destructive/10';
      case 'Severely Not Viable':
        return 'border-destructive bg-destructive/10';
    }
  };

  if (showConfirmation && selectedScenario) {
    const isChangingScenario = currentSelection && currentSelection !== selectedScenario;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isChangingScenario ? 'Confirm Scenario Change' : 'Confirm Scenario Selection'}
            </DialogTitle>
            <DialogDescription>
              {isChangingScenario
                ? `You're about to change from Scenario ${currentSelection} to Scenario ${selectedScenario}. This will update all downstream calculations.`
                : `You're about to proceed using Scenario ${selectedScenario}. All future planning will use this scenario's data.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isChangingScenario ? (
              <>
                <p className="text-sm text-muted-foreground mb-4 font-semibold">
                  Changing scenarios will recalculate:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Sales Predictions and break-even dates</li>
                  <li>Business Plan projections</li>
                  <li>All financial forecasts</li>
                  <li>Viability assessments</li>
                </ul>
                <p className="text-sm text-warning-foreground mt-4 font-semibold">
                  Make sure you've reviewed the new scenario's numbers carefully before proceeding.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  This will lock in your chosen scenario for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Sales Predictions</li>
                  <li>Business Plan Builder</li>
                  <li>All exports and reports</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  You can return to this page later to change your selection if needed.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className={isChangingScenario ? "bg-warning hover:bg-warning/90 text-warning-foreground" : "bg-brand hover:bg-brand/90 text-brand-foreground"}
            >
              {isChangingScenario ? 'Confirm Change' : 'Confirm and Proceed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Scenario to Proceed</DialogTitle>
          <DialogDescription>
            Choose which scenario you want to use for all future planning steps. You can compare the key metrics below to make your decision.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {scenarios.map(({ number, data }) => {
            const viability = calculateScenarioViability(data, period);
            const metrics = getScenarioMetrics(data, period);
            const isSelected = selectedScenario === number;

            return (
              <Card
                key={number}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-brand border-brand' : 'hover:border-brand/50'
                } ${getViabilityColor(viability)} border-2`}
                onClick={() => setSelectedScenario(number)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">Scenario {number}</CardTitle>
                    {getViabilityIcon(viability)}
                  </div>
                  <CardDescription className="text-xs">
                    <Badge
                      variant={viability === 'Likely Viable' ? 'default' : viability === 'Possibly Viable' ? 'secondary' : 'destructive'}
                      className="mt-1"
                    >
                      {viability}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target Sales ({period})</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(metrics.targetSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Required Sales ({period})</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(metrics.requiredSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gap</p>
                    <p className={`text-sm font-semibold ${
                      metrics.targetSales >= metrics.requiredSales ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatCurrency(metrics.targetSales - metrics.requiredSales)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedScenario) {
                setShowConfirmation(true);
              }
            }}
            disabled={!selectedScenario}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            Continue with Selected Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
