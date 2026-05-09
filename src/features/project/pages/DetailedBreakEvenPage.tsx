import { useState } from 'react';
import { ScenarioColumn, ScenarioData } from '@/features/project/components/ScenarioColumn';
import { ScenarioSelectionDialog } from '@/features/project/components/ScenarioSelectionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Plus, Circle as XCircle, Info } from 'lucide-react';
import { ProjectData } from '@/lib/types/projectTypes';
import { calculateRequiredSales } from '@/lib/calculations';
import { getNextRequiredStep, WALKTHROUGH_STEPS, markStepComplete } from '@/lib/walkthrough';

interface DetailedBreakEvenProps {
  data: {
    scenario1: ScenarioData;
    scenario2: ScenarioData;
    scenario3: ScenarioData;
  };
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: any) => void;
  project?: ProjectData;
  onProjectChange?: (patch: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
  onResetProject?: () => void;
}

type ViabilityStatus = 'Likely Viable' | 'Possibly Viable' | 'Not Viable' | 'Severely Not Viable';

function calculateScenarioViability(scenarioData: ScenarioData, period: 'Weekly' | 'Monthly' | 'Yearly'): ViabilityStatus {
  // Convert to monthly for calculations
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

  // Turnover rent calculations
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

  // For break-even calculations, use minimum labour as fixed cost
  const fixedCostsForBreakEven = effectiveRentFixed + labourMinimumMonthly + insuranceMonthly + accountingMonthly + marketingMonthly + utilitiesMonthly + otherFixedMonthly + customFixedTotalMonthly;
  const totalVariableForBreakEven = scenarioData.variableCogs + scenarioData.variableOther + totalFranchiseFees + rentVariablePercent;

  const requiredSalesWithOwner = calculateRequiredSales(fixedCostsForBreakEven, ownersReturnMonthlyBase, totalVariableForBreakEven);

  // Calculate the gap vs target sales
  const gapVsTarget = expectedSalesMonthly - requiredSalesWithOwner;
  const gapPercentage = expectedSalesMonthly > 0 ? (gapVsTarget / expectedSalesMonthly) * 100 : 0;

  // Determine viability status
  if (totalVariable >= 100) {
    return 'Not Viable';
  }

  // Check for severe gap: if gap is negative and exceeds -10% of expected sales
  if (gapPercentage < -10) {
    return 'Severely Not Viable';
  }

  // Check if gap is within the -10% to +10% range (too close either way)
  if (gapPercentage >= -10 && gapPercentage <= 10) {
    return 'Possibly Viable';
  }

  // Gap exceeds +10%, indicating strong viability
  return 'Likely Viable';
}

export function DetailedBreakEven({ data, period, onUpdate, project, onProjectChange, onNavigate, onResetProject }: DetailedBreakEvenProps) {
  const scenarioMode = project?.scenarioMode || 'single';
  const isSingleScenario = scenarioMode === 'single';
  const selectedScenario = project?.selectedScenario;
  const [showAddCostDialog, setShowAddCostDialog] = useState(false);
  const [newCostName, setNewCostName] = useState('');
  const [activeDecisionScenario, setActiveDecisionScenario] = useState<1 | 2 | 3>(1);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showScenarioSelectionDialog, setShowScenarioSelectionDialog] = useState(false);

  // Calculate viability for all scenarios
  const scenario1Viability = calculateScenarioViability(data.scenario1, period);
  const scenario2Viability = calculateScenarioViability(data.scenario2, period);
  const scenario3Viability = calculateScenarioViability(data.scenario3, period);

  const nextStep = project ? getNextRequiredStep(project, WALKTHROUGH_STEPS.DETAILED_BREAK_EVEN) : null;
  const nextStepLabel = nextStep ? `Continue to Step ${nextStep.stepNumber}: ${nextStep.stepName}` : 'Continue';

  const handleContinueToNextStep = () => {
    if (!isSingleScenario && !selectedScenario) {
      setShowScenarioSelectionDialog(true);
      return;
    }

    if (project && onProjectChange) {
      const updates = markStepComplete(project, WALKTHROUGH_STEPS.DETAILED_BREAK_EVEN);
      onProjectChange(updates);
    }
    onNavigate?.(nextStep?.route || '/hours-of-operation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScenarioSelection = (scenarioNumber: 1 | 2 | 3) => {
    if (onProjectChange) {
      onProjectChange({ selectedScenario: scenarioNumber });
    }
  };

  const handleChangeScenario = () => {
    setShowScenarioSelectionDialog(true);
  };

  const isFranchise = data.scenario1.isFranchise ?? false;
  const franchiseName = data.scenario1.franchiseName ?? '';
  const franchiseRoyaltyPercent = data.scenario1.franchiseRoyaltyPercent ?? 0;
  const franchiseMarketingPercent = data.scenario1.franchiseMarketingPercent ?? 0;

  const handleFranchiseToggle = (checked: boolean) => {
    onUpdate({
      scenario1: { ...data.scenario1, isFranchise: checked },
      scenario2: { ...data.scenario2, isFranchise: checked },
      scenario3: { ...data.scenario3, isFranchise: checked },
    });
  };

  const handleFranchiseNameChange = (value: string) => {
    onUpdate({
      scenario1: { ...data.scenario1, franchiseName: value },
      scenario2: { ...data.scenario2, franchiseName: value },
      scenario3: { ...data.scenario3, franchiseName: value },
    });
  };

  const handleFranchiseRoyaltyChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(numericValue) || 0;
    onUpdate({
      scenario1: { ...data.scenario1, franchiseRoyaltyPercent: parsedValue },
      scenario2: { ...data.scenario2, franchiseRoyaltyPercent: parsedValue },
      scenario3: { ...data.scenario3, franchiseRoyaltyPercent: parsedValue },
    });
  };

  const handleFranchiseMarketingChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(numericValue) || 0;
    onUpdate({
      scenario1: { ...data.scenario1, franchiseMarketingPercent: parsedValue },
      scenario2: { ...data.scenario2, franchiseMarketingPercent: parsedValue },
      scenario3: { ...data.scenario3, franchiseMarketingPercent: parsedValue },
    });
  };

  const handleAddCustomCostToAll = () => {
    if (newCostName.trim()) {
      const newCost = {
        id: `custom_${Date.now()}`,
        name: newCostName.trim(),
        value: 0,
      };

      onUpdate({
        scenario1: {
          ...data.scenario1,
          customFixedCosts: [...(data.scenario1.customFixedCosts || []), newCost],
        },
        scenario2: {
          ...data.scenario2,
          customFixedCosts: [...(data.scenario2.customFixedCosts || []), newCost],
        },
        scenario3: {
          ...data.scenario3,
          customFixedCosts: [...(data.scenario3.customFixedCosts || []), newCost],
        },
      });
      setNewCostName('');
      setShowAddCostDialog(false);
    }
  };

  const handleDeleteCustomCostFromAll = (id: string) => {
    onUpdate({
      scenario1: {
        ...data.scenario1,
        customFixedCosts: (data.scenario1.customFixedCosts || []).filter(cost => cost.id !== id),
      },
      scenario2: {
        ...data.scenario2,
        customFixedCosts: (data.scenario2.customFixedCosts || []).filter(cost => cost.id !== id),
      },
      scenario3: {
        ...data.scenario3,
        customFixedCosts: (data.scenario3.customFixedCosts || []).filter(cost => cost.id !== id),
      },
    });
  };

  const handleReviewNewOpportunity = () => {
    setShowResetConfirmation(true);
  };

  const handleConfirmReset = () => {
    setShowResetConfirmation(false);
    onResetProject?.();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 3. Detailed Break-Even Check</CardTitle>
          <CardDescription>Detailed analysis with multiple scenarios and custom costs</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-center">Scenario Mode</CardTitle>
          <CardDescription className="text-center">
            Choose how many scenarios to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
              <button
                onClick={() => onProjectChange?.({ scenarioMode: 'single' })}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSingleScenario
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Single Scenario
              </button>
              <button
                onClick={() => onProjectChange?.({ scenarioMode: 'multi' })}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  !isSingleScenario
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Multi Scenario
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isSingleScenario && selectedScenario && (
        <Alert className="border-info/30 bg-info/10">
          <Info className="h-5 w-5 text-info" />
          <AlertDescription className="text-info">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">
                  Selected Scenario: <Badge variant="default" className="ml-2">Scenario {selectedScenario}</Badge>
                </p>
                <p className="text-sm">
                  This scenario will be used for all future planning steps including Sales Predictions and Business Plan Builder.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeScenario}
                className="ml-4"
              >
                Change Selection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isSingleScenario && !selectedScenario && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTriangle className="h-5 w-5 !text-warning" />
          <AlertDescription>
            <p className="font-semibold mb-1">Scenario Selection Required</p>
            <p className="text-sm">
              You must select a scenario before proceeding to the next step. Click &quot;Continue&quot; below to choose your preferred scenario.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle className="text-base">Franchise Mode</CardTitle>
          <CardDescription className="text-xs">Configure franchise settings that apply to all scenarios</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="franchise-toggle" className="text-sm font-medium">Is this a Franchise?</Label>
            <Switch
              id="franchise-toggle"
              checked={isFranchise}
              onCheckedChange={handleFranchiseToggle}
            />
          </div>

          {isFranchise && (
            <div className="pt-2 border-t">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="franchise-name" className="text-sm">Franchise Name</Label>
                  <Input
                    id="franchise-name"
                    type="text"
                    className="h-9 text-sm"
                    value={franchiseName}
                    onChange={(e) => handleFranchiseNameChange(e.target.value)}
                    placeholder="e.g., McDonald's, Subway, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="franchise-royalty" className="text-sm">Royalty %</Label>
                  <div className="relative">
                    <Input
                      id="franchise-royalty"
                      type="text"
                      className="pr-7 h-9 text-sm"
                      value={franchiseRoyaltyPercent.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      onChange={(e) => handleFranchiseRoyaltyChange(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="franchise-marketing" className="text-sm">Marketing %</Label>
                  <div className="relative">
                    <Input
                      id="franchise-marketing"
                      type="text"
                      className="pr-7 h-9 text-sm"
                      value={franchiseMarketingPercent.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      onChange={(e) => handleFranchiseMarketingChange(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 ${isSingleScenario ? 'lg:grid-cols-1 max-w-2xl mx-auto' : 'lg:grid-cols-3'} gap-6`}>
        <ScenarioColumn
          scenarioNumber={1}
          data={data.scenario1}
          period={period}
          onUpdate={(updatedData) => onUpdate({ ...data, scenario1: updatedData })}
          onDeleteCustomCost={handleDeleteCustomCostFromAll}
          fixedCostsOnly={true}
        />
        {!isSingleScenario && (
          <>
            <ScenarioColumn
              scenarioNumber={2}
              data={data.scenario2}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario2: updatedData })}
              onDeleteCustomCost={handleDeleteCustomCostFromAll}
              fixedCostsOnly={true}
            />
            <ScenarioColumn
              scenarioNumber={3}
              data={data.scenario3}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario3: updatedData })}
              onDeleteCustomCost={handleDeleteCustomCostFromAll}
              fixedCostsOnly={true}
            />
          </>
        )}
      </div>

      <div className={`mt-6 ${isSingleScenario ? 'max-w-2xl mx-auto' : ''}`}>
        <Button
          variant="outline"
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary"
          onClick={() => setShowAddCostDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Fixed Cost
        </Button>
      </div>

      <div className={`grid grid-cols-1 ${isSingleScenario ? 'lg:grid-cols-1 max-w-2xl mx-auto' : 'lg:grid-cols-3'} gap-6 mt-6`}>
        <ScenarioColumn
          scenarioNumber={1}
          data={data.scenario1}
          period={period}
          onUpdate={(updatedData) => onUpdate({ ...data, scenario1: updatedData })}
          onDeleteCustomCost={handleDeleteCustomCostFromAll}
          variableCostsOnly={true}
        />
        {!isSingleScenario && (
          <>
            <ScenarioColumn
              scenarioNumber={2}
              data={data.scenario2}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario2: updatedData })}
              onDeleteCustomCost={handleDeleteCustomCostFromAll}
              variableCostsOnly={true}
            />
            <ScenarioColumn
              scenarioNumber={3}
              data={data.scenario3}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario3: updatedData })}
              onDeleteCustomCost={handleDeleteCustomCostFromAll}
              variableCostsOnly={true}
            />
          </>
        )}
      </div>

      {/* Decision Panel */}
      <div className={`mt-8 ${isSingleScenario ? 'max-w-2xl mx-auto' : ''}`}>
        {isSingleScenario ? (
          // Single Scenario Decision Panel
          <>
            {scenario1Viability === 'Likely Viable' && (
              <Card className="border-2 border-success/50 bg-success/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle2 className="h-12 w-12 text-success" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Numbers Look Promising
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your detailed analysis shows this opportunity is likely viable. The numbers support moving forward with a comprehensive business plan.
                      </p>
                    </div>
                    <Button
                      onClick={handleContinueToNextStep}
                      size="lg"
                      className="font-semibold bg-success hover:bg-success/90 text-success-foreground"
                    >
                      {nextStepLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {scenario1Viability === 'Possibly Viable' && (
              <Card className="border-2 border-warning/30 bg-warning/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-warning-foreground" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Too Close to Call
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your numbers are within 10% of break-even either way. This is too close for comfort and warrants more investigation. Consider refining your assumptions, gathering more data, or exploring different scenarios before making a final decision.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                      >
                        Stop and Review
                      </Button>
                      <Button
                        onClick={handleContinueToNextStep}
                        size="lg"
                        className="font-semibold bg-warning hover:bg-warning/90 text-warning-foreground"
                      >
                        {nextStepLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {scenario1Viability === 'Severely Not Viable' && (
              <Card className="border-2 border-destructive bg-destructive/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <XCircle className="h-12 w-12 text-destructive" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Stop and Walk Away
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your expected sales fall short of requirements by more than 10%. This opportunity does not support a viable business model on these numbers. It's strongly recommended to walk away or review a different opportunity.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                      >
                        Stop and Review
                      </Button>
                      <Button
                        onClick={handleReviewNewOpportunity}
                        size="lg"
                        variant="destructive"
                        className="font-semibold"
                      >
                        Review New Opportunity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {scenario1Viability === 'Not Viable' && (
              <Card className="border-2 border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <XCircle className="h-12 w-12 text-destructive" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Business Unlikely to Be Viable
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Based on your current assumptions, this business is unlikely to be viable. The numbers don't support proceeding. Consider walking away or significantly reworking your plan before committing resources.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-md">
                      <Button
                        size="lg"
                        variant="destructive"
                        className="font-semibold w-full"
                      >
                        Walk Away
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1"
                        >
                          Stop and Review
                        </Button>
                        <Button
                          onClick={handleContinueToNextStep}
                          size="lg"
                          className="flex-1 font-semibold"
                        >
                          {nextStepLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // Multi Scenario Decision Panel with Tabs
          <Card className="border-2 border-info/30">
            <CardHeader>
              <CardTitle className="text-center">Scenario Viability Assessment</CardTitle>
              <CardDescription className="text-center">
                Select a scenario to view its viability and make a decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={`scenario${activeDecisionScenario}`} onValueChange={(value) => setActiveDecisionScenario(parseInt(value.replace('scenario', '')) as 1 | 2 | 3)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="scenario1" className="relative">
                    Scenario 1
                    {scenario1Viability === 'Likely Viable' && <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />}
                    {scenario1Viability === 'Possibly Viable' && <AlertTriangle className="h-3 w-3 text-warning-foreground absolute -top-1 -right-1" />}
                    {scenario1Viability === 'Severely Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                    {scenario1Viability === 'Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                  </TabsTrigger>
                  <TabsTrigger value="scenario2" className="relative">
                    Scenario 2
                    {scenario2Viability === 'Likely Viable' && <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />}
                    {scenario2Viability === 'Possibly Viable' && <AlertTriangle className="h-3 w-3 text-warning-foreground absolute -top-1 -right-1" />}
                    {scenario2Viability === 'Severely Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                    {scenario2Viability === 'Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                  </TabsTrigger>
                  <TabsTrigger value="scenario3" className="relative">
                    Scenario 3
                    {scenario3Viability === 'Likely Viable' && <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />}
                    {scenario3Viability === 'Possibly Viable' && <AlertTriangle className="h-3 w-3 text-warning-foreground absolute -top-1 -right-1" />}
                    {scenario3Viability === 'Severely Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                    {scenario3Viability === 'Not Viable' && <XCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scenario1">
                  {scenario1Viability === 'Likely Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-success/10 rounded-lg border-2 border-success/50">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Numbers Look Promising</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 1 shows this opportunity is likely viable.
                        </p>
                      </div>
                      <Button onClick={handleContinueToNextStep} className="bg-success hover:bg-success/90 text-success-foreground">
                        {nextStepLabel}
                      </Button>
                    </div>
                  )}
                  {scenario1Viability === 'Possibly Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-warning/10 rounded-lg border-2 border-warning/30">
                      <AlertTriangle className="h-10 w-10 text-warning-foreground" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Too Close to Call</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 1 is within 10% of break-even. More investigation needed.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleContinueToNextStep} className="bg-warning hover:bg-warning/90 text-warning-foreground">{nextStepLabel}</Button>
                      </div>
                    </div>
                  )}
                  {scenario1Viability === 'Severely Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Stop and Walk Away</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 1 shows a gap exceeding 10% of sales.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleReviewNewOpportunity} variant="destructive">Review New Opportunity</Button>
                      </div>
                    </div>
                  )}
                  {scenario1Viability === 'Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive/50">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Business Unlikely to Be Viable</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 1 numbers don't support proceeding.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Button variant="destructive" className="w-full">Walk Away</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">Stop and Review</Button>
                          <Button onClick={handleContinueToNextStep} className="flex-1">{nextStepLabel}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scenario2">
                  {scenario2Viability === 'Likely Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-success/10 rounded-lg border-2 border-success/50">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Numbers Look Promising</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 2 shows this opportunity is likely viable.
                        </p>
                      </div>
                      <Button onClick={handleContinueToNextStep} className="bg-success hover:bg-success/90 text-success-foreground">
                        {nextStepLabel}
                      </Button>
                    </div>
                  )}
                  {scenario2Viability === 'Possibly Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-warning/10 rounded-lg border-2 border-warning/30">
                      <AlertTriangle className="h-10 w-10 text-warning-foreground" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Too Close to Call</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 2 is within 10% of break-even. More investigation needed.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleContinueToNextStep} className="bg-warning hover:bg-warning/90 text-warning-foreground">{nextStepLabel}</Button>
                      </div>
                    </div>
                  )}
                  {scenario2Viability === 'Severely Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Stop and Walk Away</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 2 shows a gap exceeding 10% of sales.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleReviewNewOpportunity} variant="destructive">Review New Opportunity</Button>
                      </div>
                    </div>
                  )}
                  {scenario2Viability === 'Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive/50">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Business Unlikely to Be Viable</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 2 numbers don't support proceeding.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Button variant="destructive" className="w-full">Walk Away</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">Stop and Review</Button>
                          <Button onClick={handleContinueToNextStep} className="flex-1">{nextStepLabel}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scenario3">
                  {scenario3Viability === 'Likely Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-success/10 rounded-lg border-2 border-success/50">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Numbers Look Promising</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 3 shows this opportunity is likely viable.
                        </p>
                      </div>
                      <Button onClick={handleContinueToNextStep} className="bg-success hover:bg-success/90 text-success-foreground">
                        {nextStepLabel}
                      </Button>
                    </div>
                  )}
                  {scenario3Viability === 'Possibly Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-warning/10 rounded-lg border-2 border-warning/30">
                      <AlertTriangle className="h-10 w-10 text-warning-foreground" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Too Close to Call</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 3 is within 10% of break-even. More investigation needed.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleContinueToNextStep} className="bg-warning hover:bg-warning/90 text-warning-foreground">{nextStepLabel}</Button>
                      </div>
                    </div>
                  )}
                  {scenario3Viability === 'Severely Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Stop and Walk Away</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 3 shows a gap exceeding 10% of sales.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Stop and Review</Button>
                        <Button onClick={handleReviewNewOpportunity} variant="destructive">Review New Opportunity</Button>
                      </div>
                    </div>
                  )}
                  {scenario3Viability === 'Not Viable' && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive/50">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground mb-1">Business Unlikely to Be Viable</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Scenario 3 numbers don't support proceeding.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Button variant="destructive" className="w-full">Walk Away</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">Stop and Review</Button>
                          <Button onClick={handleContinueToNextStep} className="flex-1">{nextStepLabel}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddCostDialog} onOpenChange={setShowAddCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fixed Cost to All Scenarios</DialogTitle>
            <DialogDescription>
              Enter a name for the new fixed cost item. It will be added to all three scenarios.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cost-name">Cost Name</Label>
            <Input
              id="cost-name"
              value={newCostName}
              onChange={(e) => setNewCostName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCostToAll()}
              placeholder="e.g., Cleaning, Security, etc."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomCostToAll} disabled={!newCostName.trim()}>
              Add Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are You Sure?</DialogTitle>
            <DialogDescription>
              This will reset all your project data and start fresh with a new opportunity. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirmation(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScenarioSelectionDialog
        open={showScenarioSelectionDialog}
        onOpenChange={setShowScenarioSelectionDialog}
        scenario1={data.scenario1}
        scenario2={data.scenario2}
        scenario3={data.scenario3}
        period={period}
        currentSelection={selectedScenario}
        onConfirm={handleScenarioSelection}
      />
    </div>
  );
}
