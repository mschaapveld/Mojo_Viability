import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, AlertTriangle, Download, Info, XCircle, HelpCircle } from 'lucide-react';
import { calculateRequiredSales, formatCurrency, formatPercentage } from '@/lib/calculations';
import { ProjectData } from '@/lib/types/projectTypes';
import { markStepComplete, markStepFailed, WALKTHROUGH_STEPS } from '@/lib/walkthrough';

interface SimpleBreakEvenProps {
  data: {
    enteredSales: number;
    ownersReturn: number;
    rent: number;
    variableCogs: number;
    variableLabour: number;
    variableOther: number;
  };
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: any) => void;
  onExport?: () => void;
  overallStatus?: 'good' | 'borderline' | 'bad';
  onNavigateToPlan?: () => void;
  project?: ProjectData;
  onProjectUpdate?: (updates: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
}

export function SimpleBreakEven({ data, period, onUpdate, onExport, onNavigateToPlan, project, onProjectUpdate, onNavigate }: SimpleBreakEvenProps) {
  const totalVariable = data.variableCogs + data.variableLabour + data.variableOther;
  const fixedCosts = data.rent;
  const breakEvenSales = calculateRequiredSales(fixedCosts, 0, totalVariable);
  const requiredSalesWithOwner = calculateRequiredSales(fixedCosts, data.ownersReturn, totalVariable);

  const hasError = totalVariable >= 100;
  const hasWarning = !hasError && requiredSalesWithOwner > data.enteredSales;
  const isViable = !hasError && !hasWarning;

  const handleContinue = () => {
    if (!project || !onProjectUpdate) {
      onNavigateToPlan?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (hasError || hasWarning) {
      const updates = markStepFailed(project, WALKTHROUGH_STEPS.SIMPLE_BREAK_EVEN);
      onProjectUpdate(updates);
      return;
    }

    const updates = markStepComplete(project, WALKTHROUGH_STEPS.SIMPLE_BREAK_EVEN);
    onProjectUpdate(updates);

    if (onNavigate) {
      onNavigate('/business-plan-builder');
    } else if (onNavigateToPlan) {
      onNavigateToPlan();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 1. Simple Break-Even Check</CardTitle>
          <CardDescription>Calculate your break-even point and required sales based on the rent of your new site</CardDescription>
        </CardHeader>
      </Card>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variable costs total {formatPercentage(totalVariable)}. This must be less than 100% for the business to be viable.
          </AlertDescription>
        </Alert>
      )}

      {hasWarning && (
        <Alert className="bg-warning/10 border-warning/30">
          <AlertTriangle className="h-4 w-4 !text-warning" />
          <AlertDescription>
            Required sales ({formatCurrency(requiredSalesWithOwner)}) exceed entered sales ({formatCurrency(data.enteredSales)}).
            Your business may not be viable at this sales level.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-2">
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle>Fixed Costs</CardTitle>
            <CardDescription>Start by entering your {period.toLowerCase()} rent</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label htmlFor="rent">Rent ({period})</Label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="rent"
                  type="text"
                  className="pl-7"
                  value={formatInputCurrency(data.rent)}
                  onChange={(e) => handleCurrencyChange('rent', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle>Variable Costs</CardTitle>
            <CardDescription>Enter your variable costs as percentages of sales</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label htmlFor="variableCogs">COGS</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Cost of Goods Sold - the direct costs of food, beverages, and ingredients as a percentage of sales</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="variableCogs"
                    type="text"
                    className="pr-7"
                    value={formatInputPercentage(data.variableCogs)}
                    onChange={(e) => handlePercentageChange('variableCogs', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label htmlFor="variableLabour">Labour</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Labour costs that vary with sales volume (hourly wages for front of house and kitchen staff) as a percentage of sales</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="variableLabour"
                    type="text"
                    className="pr-7"
                    value={formatInputPercentage(data.variableLabour)}
                    onChange={(e) => handlePercentageChange('variableLabour', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label htmlFor="variableOther">Other</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Other variable costs like delivery fees, packaging, credit card processing fees, etc. as a percentage of sales</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="variableOther"
                    type="text"
                    className="pr-7"
                    value={formatInputPercentage(data.variableOther)}
                    onChange={(e) => handlePercentageChange('variableOther', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="text-right font-semibold">
              Total Variable: {formatPercentage(totalVariable)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle>Revenue & Targets</CardTitle>
          <CardDescription>Enter your expected sales and desired owner's return</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label htmlFor="enteredSales">Expected Sales ({period})</Label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="enteredSales"
                  type="text"
                  className="pl-7"
                  value={formatInputCurrency(data.enteredSales)}
                  onChange={(e) => handleCurrencyChange('enteredSales', e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label htmlFor="ownersReturn">Owner's Return ({period})</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The amount you want to take home as the owner. This is your target income before tax from the business.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="ownersReturn"
                  type="text"
                  className="pl-7"
                  value={formatInputCurrency(data.ownersReturn)}
                  onChange={(e) => handleCurrencyChange('ownersReturn', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-info/30">
        <CardHeader className="bg-info/10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle>Break-Even Results</CardTitle>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Fixed Costs:</span>
              <span className="text-lg">{formatCurrency(fixedCosts)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Total Variable %:</span>
              <span className="text-lg">{formatPercentage(totalVariable)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Required Sales to Break-Even:</span>
              <span className="text-lg font-semibold">
                {hasError ? 'Invalid' : formatCurrency(breakEvenSales)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-info/10 rounded-lg">
              <span className="font-bold text-lg">Required Sales to Pay the Owner:</span>
              <span className="text-2xl font-bold text-info">
                {hasError ? 'Invalid' : formatCurrency(requiredSalesWithOwner)}
              </span>
            </div>
            {!hasError && (
              <div className="p-4 bg-surface-2 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xl">
                        {data.enteredSales >= requiredSalesWithOwner
                          ? 'Surplus Above Break-Even (Not Profit)'
                          : 'Shortfall Below Break-Even'}
                      </span>
                      <Info className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {data.enteredSales >= requiredSalesWithOwner
                        ? "Your expected sales exceed the minimum revenue needed by this amount. This is NOT profit - it does not include tax, loan repayments, CAPEX, or working capital."
                        : "Your expected sales fall short of the minimum revenue needed by this amount. You need to increase sales or reduce costs."}
                    </p>
                  </div>
                  <span className={`text-lg font-semibold ${data.enteredSales >= requiredSalesWithOwner ? 'text-success' : 'text-destructive'} ml-4`}>
                    {formatCurrency(Math.abs(data.enteredSales - requiredSalesWithOwner))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {data.enteredSales >= requiredSalesWithOwner
                    ? `You are ${formatCurrency(data.enteredSales - requiredSalesWithOwner)} above the minimum revenue required to cover all costs and your owner's return.`
                    : `You need an additional ${formatCurrency(requiredSalesWithOwner - data.enteredSales)} in revenue to cover costs and your owner's return.`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasError && (
        <Card className="border-2 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Business Not Viable
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your variable costs exceed 100% of sales, making this business model impossible to sustain.
                  You'll need to significantly reduce your cost structure or find alternative business models
                  before proceeding.
                </p>
              </div>
              <Button
                onClick={handleContinue}
                variant="destructive"
                size="lg"
                className="font-semibold"
              >
                Stop and Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasWarning && !hasError && (
        <Card className="border-2 border-warning/30 bg-warning/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-warning-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Business May Not Be Viable
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your expected sales don't cover all costs and your target owner's return. You may want
                  to adjust your numbers, reduce costs, or reconsider this opportunity before building
                  a full plan.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  size="lg"
                >
                  Stop and Review
                </Button>
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="font-semibold bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  Continue Anyway
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isViable && (
        <Card className="border-2 border-brand bg-brand/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to Build a Detailed Plan?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your numbers look promising! Create a comprehensive business plan with detailed break-even
                  analysis, labour planning, sales predictions, and more.
                </p>
              </div>
              <Button
                onClick={handleContinue}
                size="lg"
                className="font-semibold bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                Let's Make a Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
