import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface CustomSetupCost {
  id: string;
  name: string;
  amount: number;
}

export interface FitoutScenarioData {
  name: string;
  siteType: 'new' | 'existing';
  purchasePrice?: number;
  equipment: number;
  furniture: number;
  tech: number;
  stock: number;
  fitout: number;
  signage: number;
  designFees?: number;
  legal: number;
  operatingCapital: number;
  customSetupCosts: CustomSetupCost[];
  startupCapital: number;
  loanAmount: number;
  loanInterest: number;
  loanTerm: number;
  balloonPercent: number;
  repaymentFrequency: string;
  equipmentRentalAmount: number;
  occupancyType?: 'renting' | 'purchasing';
  propertyPurchasePrice?: number;
  propertyDeposit?: number;
  propertyClosingCosts?: number;
  propertyStampDuty?: number;
  propertyGstPayable?: boolean;
  propertyInterestRate?: number;
  propertyLoanTerm?: number;
}

interface FitoutFinancingColumnProps {
  scenarioNumber: number;
  data: FitoutScenarioData;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: FitoutScenarioData) => void;
  onDeleteCustomCost?: (id: string) => void;
  maxCustomCosts?: number;
}

export function FitoutFinancingColumn({ scenarioNumber, data, period, onUpdate, onDeleteCustomCost, maxCustomCosts = 0 }: FitoutFinancingColumnProps) {
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showAddCostDialog, setShowAddCostDialog] = useState(false);
  const [newCostName, setNewCostName] = useState('');

  const handleCurrencyChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const handlePercentChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const handleAddCustomCost = () => {
    if (newCostName.trim()) {
      const newCost: CustomSetupCost = {
        id: `custom_${Date.now()}_${scenarioNumber}`,
        name: newCostName.trim(),
        amount: 0,
      };
      onUpdate({
        ...data,
        customSetupCosts: [...data.customSetupCosts, newCost],
      });
      setNewCostName('');
      setShowAddCostDialog(false);
    }
  };

  const handleUpdateCustomCost = (id: string, field: 'name' | 'amount', value: string | number) => {
    const updatedCosts = data.customSetupCosts.map((cost) =>
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    onUpdate({ ...data, customSetupCosts: updatedCosts });
  };

  const handleDeleteCustomCost = (id: string) => {
    if (onDeleteCustomCost) {
      onDeleteCustomCost(id);
    } else {
      const updatedCosts = data.customSetupCosts.filter((cost) => cost.id !== id);
      onUpdate({ ...data, customSetupCosts: updatedCosts });
    }
  };

  const isNew = data.siteType === 'new';
  const occupancyType = data.occupancyType || 'renting';
  const isPurchasing = occupancyType === 'purchasing';

  const propertyPurchaseCosts = isPurchasing ? (
    (data.propertyDeposit || 0) +
    (data.propertyClosingCosts || 0) +
    (data.propertyStampDuty || 0) +
    (data.propertyGstPayable ? (data.propertyPurchasePrice || 0) * 0.1 : 0)
  ) : 0;

  const totalSetupCosts = (isNew ? 0 : (data.purchasePrice || 0)) +
    data.equipment +
    data.furniture +
    data.tech +
    data.stock +
    data.fitout +
    (isNew ? data.signage : 0) +
    (data.designFees || 0) +
    data.legal +
    data.operatingCapital +
    data.customSetupCosts.reduce((sum, cost) => sum + cost.amount, 0) +
    propertyPurchaseCosts;

  const ownersCash = data.startupCapital;
  const totalFundingAvailable = ownersCash + data.equipmentRentalAmount + data.loanAmount;
  const surplusShortfall = totalFundingAvailable - totalSetupCosts;

  const weeklyRentalCost = (data.equipmentRentalAmount / 10000) * 126.92;

  const monthlyInterestRate = data.loanInterest / 100 / 12;
  const numberOfPayments = data.loanTerm * 12;
  const balloonAmount = (data.loanAmount * data.balloonPercent) / 100;
  const principalToAmortize = data.loanAmount - balloonAmount;

  let monthlyPayment = 0;
  if (monthlyInterestRate > 0 && numberOfPayments > 0) {
    const amortizedPayment =
      (principalToAmortize * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    monthlyPayment = amortizedPayment;
  } else if (numberOfPayments > 0) {
    monthlyPayment = principalToAmortize / numberOfPayments;
  }

  const totalAmortizedPayments = monthlyPayment * numberOfPayments;
  const totalInterest = totalAmortizedPayments - principalToAmortize;
  const totalRepayment = totalAmortizedPayments + balloonAmount;

  const periodicLoanPayment =
    period === 'Weekly' ? monthlyPayment / (52 / 12) :
    period === 'Yearly' ? monthlyPayment * 12 :
    monthlyPayment;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center">Scenario {scenarioNumber}</h3>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Site &amp; Occupancy</CardTitle>
            <CardDescription className="text-xs">Is this a new or existing site? Will you be renting or buying?</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground w-24">Site type</span>
              <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
                <button
                  onClick={() => onUpdate({ ...data, siteType: 'new' })}
                  className={`min-w-[90px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                    isNew
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  New
                </button>
                <button
                  onClick={() => onUpdate({ ...data, siteType: 'existing' })}
                  className={`min-w-[90px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                    !isNew
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Existing
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground w-24">Occupancy</span>
              <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
                <button
                  onClick={() => onUpdate({ ...data, occupancyType: 'renting' })}
                  className={`min-w-[90px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                    !isPurchasing
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Renting
                </button>
                <button
                  onClick={() => onUpdate({ ...data, occupancyType: 'purchasing' })}
                  className={`min-w-[90px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                    isPurchasing
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Buying
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPurchasing && (
          <Card>
            <CardHeader className="bg-warning/10 rounded-t-lg border-b border-warning/20">
              <CardTitle className="text-base">Property Purchase</CardTitle>
              <CardDescription className="text-xs">Enter property purchase details and financing</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label htmlFor={`prop-purchase-${scenarioNumber}`} className="text-sm">Purchase Price</Label>
                <Input
                  id={`prop-purchase-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.propertyPurchasePrice || 0)}
                  onChange={(e) => handleCurrencyChange('propertyPurchasePrice', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`prop-deposit-${scenarioNumber}`} className="text-sm">Deposit</Label>
                <Input
                  id={`prop-deposit-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.propertyDeposit || 0)}
                  onChange={(e) => handleCurrencyChange('propertyDeposit', e.target.value)}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground mt-1">Cash or equivalent paid upfront</p>
              </div>
              <div>
                <Label htmlFor={`prop-closing-${scenarioNumber}`} className="text-sm">Closing Costs</Label>
                <Input
                  id={`prop-closing-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.propertyClosingCosts || 0)}
                  onChange={(e) => handleCurrencyChange('propertyClosingCosts', e.target.value)}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground mt-1">Solicitor, conveyancing, inspections</p>
              </div>
              <div>
                <Label htmlFor={`prop-stamp-${scenarioNumber}`} className="text-sm text-destructive">
                  Stamp Duty <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`prop-stamp-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.propertyStampDuty || 0)}
                  onChange={(e) => handleCurrencyChange('propertyStampDuty', e.target.value)}
                  className="text-right border-destructive/30 focus:border-destructive/60"
                  required
                />
                <div className="mt-2 text-xs text-muted-foreground bg-surface-2 p-2 rounded">
                  <p className="mb-1">Calculate stamp duty externally:</p>
                  <a
                    href="https://www.macquarie.com.au/home-loans/home-loan-calculators/stamp-duty-calculator.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:text-info/80 underline inline-flex items-center gap-1"
                  >
                    Macquarie Stamp Duty Calculator
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded">
                <div>
                  <Label htmlFor={`prop-gst-${scenarioNumber}`} className="text-sm font-medium">GST Payable</Label>
                  <p className="text-xs text-muted-foreground mt-1">10% if property purchased vacant</p>
                </div>
                <Switch
                  id={`prop-gst-${scenarioNumber}`}
                  checked={data.propertyGstPayable || false}
                  onCheckedChange={(checked) => onUpdate({ ...data, propertyGstPayable: checked })}
                />
              </div>
              {data.propertyGstPayable && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GST Amount (10%):</span>
                    <span className="text-lg font-bold">{formatCurrency((data.propertyPurchasePrice || 0) * 0.1)}</span>
                  </div>
                  <p className="text-xs text-warning-foreground mt-2">Paid upfront, claimable later. Creates cashflow impact.</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Property Loan</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`prop-interest-${scenarioNumber}`} className="text-sm">Interest Rate (%)</Label>
                  <Input
                    id={`prop-interest-${scenarioNumber}`}
                    type="text"
                    value={data.propertyInterestRate || 6.5}
                    onChange={(e) => handlePercentChange('propertyInterestRate', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor={`prop-term-${scenarioNumber}`} className="text-sm">Loan Term (Years)</Label>
                  <Input
                    id={`prop-term-${scenarioNumber}`}
                    type="number"
                    value={data.propertyLoanTerm || 25}
                    onChange={(e) => onUpdate({ ...data, propertyLoanTerm: parseInt(e.target.value) || 25 })}
                    className="text-right"
                  />
                </div>
              </div>
              <div className="p-3 bg-info/10 border border-info/30 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Property Loan Amount:</span>
                  <span className="text-lg font-bold">{formatCurrency((data.propertyPurchasePrice || 0) - (data.propertyDeposit || 0))}</span>
                </div>
                <p className="text-xs text-muted-foreground">Purchase Price minus Deposit</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">{isNew ? 'Setup Costs' : 'Purchase & Upgrade Costs'}</CardTitle>
            <CardDescription className="text-xs">Enter all setup and initial investment costs</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-4">
              {!isNew && (
                <div>
                  <Label htmlFor={`purchase-${scenarioNumber}`} className="text-sm">Purchase Price</Label>
                  <Input
                    id={`purchase-${scenarioNumber}`}
                    type="text"
                    value={formatCurrency(data.purchasePrice || 0)}
                    onChange={(e) => handleCurrencyChange('purchasePrice', e.target.value)}
                    className="text-right"
                  />
                </div>
              )}
              <div>
                <Label htmlFor={`equipment-${scenarioNumber}`} className="text-sm">{isNew ? 'Equipment' : 'New Equipment'}</Label>
                <Input
                  id={`equipment-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.equipment)}
                  onChange={(e) => handleCurrencyChange('equipment', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`furniture-${scenarioNumber}`} className="text-sm">{isNew ? 'Furniture & Fittings' : 'New Furniture & Fittings'}</Label>
                <Input
                  id={`furniture-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.furniture)}
                  onChange={(e) => handleCurrencyChange('furniture', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`tech-${scenarioNumber}`} className="text-sm">{isNew ? 'Tech (POS, etc.)' : 'New Tech (POS, etc.)'}</Label>
                <Input
                  id={`tech-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.tech)}
                  onChange={(e) => handleCurrencyChange('tech', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`stock-${scenarioNumber}`} className="text-sm">{isNew ? 'Initial Stock' : 'New Initial Stock'}</Label>
                <Input
                  id={`stock-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.stock)}
                  onChange={(e) => handleCurrencyChange('stock', e.target.value)}
                  className="text-right"
                />
              </div>
{isNew ? (
                <>
                  <div>
                    <Label htmlFor={`fitout-${scenarioNumber}`} className="text-sm">Fitout</Label>
                    <Input
                      id={`fitout-${scenarioNumber}`}
                      type="text"
                      value={formatCurrency(data.fitout)}
                      onChange={(e) => handleCurrencyChange('fitout', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`signage-${scenarioNumber}`} className="text-sm">Signage</Label>
                    <Input
                      id={`signage-${scenarioNumber}`}
                      type="text"
                      value={formatCurrency(data.signage)}
                      onChange={(e) => handleCurrencyChange('signage', e.target.value)}
                      className="text-right"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor={`fitout-${scenarioNumber}`} className="text-sm">New Fitout & Signage</Label>
                  <Input
                    id={`fitout-${scenarioNumber}`}
                    type="text"
                    value={formatCurrency(data.fitout)}
                    onChange={(e) => handleCurrencyChange('fitout', e.target.value)}
                    className="text-right"
                  />
                </div>
              )}
              <div>
                <Label htmlFor={`design-${scenarioNumber}`} className="text-sm">{isNew ? 'Design Fees' : 'New Design Fees'}</Label>
                <Input
                  id={`design-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.designFees || 0)}
                  onChange={(e) => handleCurrencyChange('designFees', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`legal-${scenarioNumber}`} className="text-sm">{isNew ? 'Legal & Accounting' : 'New Legal & Accounting'}</Label>
                <Input
                  id={`legal-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.legal)}
                  onChange={(e) => handleCurrencyChange('legal', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`capital-${scenarioNumber}`} className="text-sm">{isNew ? 'Operating Capital' : 'New Operating Capital'}</Label>
                <Input
                  id={`capital-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.operatingCapital)}
                  onChange={(e) => handleCurrencyChange('operatingCapital', e.target.value)}
                  className="text-right"
                />
              </div>

              {data.customSetupCosts.map((cost) => (
                <div key={cost.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`${cost.id}-${scenarioNumber}`}>{cost.name}</Label>
                    <Input
                      id={`${cost.id}-${scenarioNumber}`}
                      type="text"
                      value={formatCurrency(cost.amount)}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                        handleUpdateCustomCost(cost.id, 'amount', parseFloat(numericValue) || 0);
                      }}
                      className="text-right"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteCustomCost(cost.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {Array.from({ length: maxCustomCosts - data.customSetupCosts.length }).map((_, idx) => (
                <div key={`spacer-${idx}`} className="h-[68px]" />
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCostDialog(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Cost
              </Button>

              <div className="flex justify-between items-center gap-2 p-3 bg-info/10 rounded font-semibold border-2 border-info/30 mt-4">
                <span className="font-bold text-sm">Total Cost:</span>
                <span className="text-lg font-bold">{formatCurrency(totalSetupCosts)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Financing</CardTitle>
            <CardDescription className="text-xs">Configure funding sources and loan terms</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor={`startup-${scenarioNumber}`} className="text-sm">Startup Capital Available</Label>
                <Input
                  id={`startup-${scenarioNumber}`}
                  type="text"
                  value={formatCurrency(data.startupCapital)}
                  onChange={(e) => handleCurrencyChange('startupCapital', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor={`rental-${scenarioNumber}`} className="text-sm">Equipment Rental $</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id={`rental-${scenarioNumber}`}
                    type="text"
                    value={formatCurrency(data.equipmentRentalAmount)}
                    onChange={(e) => handleCurrencyChange('equipmentRentalAmount', e.target.value)}
                    className="text-right"
                  />
                  <Input
                    type="text"
                    value={formatCurrency(weeklyRentalCost)}
                    disabled
                    className="text-right bg-surface-2"
                    title="Weekly Payment"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                  <div className="text-right">Total Amount</div>
                  <div className="text-right">Weekly Payment</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Business Loan</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`loan-${scenarioNumber}`} className="text-sm">Loan Amount</Label>
                  <Input
                    id={`loan-${scenarioNumber}`}
                    type="text"
                    value={formatCurrency(data.loanAmount)}
                    onChange={(e) => handleCurrencyChange('loanAmount', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor={`interest-${scenarioNumber}`} className="text-sm">Rate (%)</Label>
                  <Input
                    id={`interest-${scenarioNumber}`}
                    type="text"
                    value={data.loanInterest}
                    onChange={(e) => handlePercentChange('loanInterest', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`term-${scenarioNumber}`} className="text-sm">Term (Years)</Label>
                  <Input
                    id={`term-${scenarioNumber}`}
                    type="number"
                    value={data.loanTerm}
                    onChange={(e) => onUpdate({ ...data, loanTerm: parseInt(e.target.value) || 0 })}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor={`balloon-${scenarioNumber}`} className="text-sm">Balloon (%)</Label>
                  <Input
                    id={`balloon-${scenarioNumber}`}
                    type="text"
                    value={data.balloonPercent}
                    onChange={(e) => handlePercentChange('balloonPercent', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoanDetails(!showLoanDetails)}
                className="w-full"
              >
                {showLoanDetails ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                {showLoanDetails ? 'Hide' : 'Show'} Loan Details
              </Button>

              {showLoanDetails && (
                <div className="space-y-2 p-4 bg-surface-2 rounded">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Payment:</span>
                    <span className="font-medium">{formatCurrency(monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balloon Amount:</span>
                    <span className="font-medium">{formatCurrency(balloonAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Interest:</span>
                    <span className="font-medium">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground font-semibold">Total Repayment:</span>
                    <span className="font-bold">{formatCurrency(totalRepayment)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-info/30">
          <CardHeader className="bg-info/10 rounded-t-lg">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {isPurchasing && propertyPurchaseCosts > 0 && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded">
                  <div className="font-semibold text-sm mb-2">Property Purchase Costs:</div>
                  <div className="space-y-1 text-xs">
                    {(data.propertyDeposit || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deposit:</span>
                        <span className="font-medium">{formatCurrency(data.propertyDeposit || 0)}</span>
                      </div>
                    )}
                    {(data.propertyClosingCosts || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Closing Costs:</span>
                        <span className="font-medium">{formatCurrency(data.propertyClosingCosts || 0)}</span>
                      </div>
                    )}
                    {(data.propertyStampDuty || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stamp Duty:</span>
                        <span className="font-medium">{formatCurrency(data.propertyStampDuty || 0)}</span>
                      </div>
                    )}
                    {data.propertyGstPayable && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (10%):</span>
                        <span className="font-medium">{formatCurrency((data.propertyPurchasePrice || 0) * 0.1)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-warning/30 mt-1">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">{formatCurrency(propertyPurchaseCosts)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
                <span className="font-medium">Total Setup Costs:</span>
                <span className="text-lg">{formatCurrency(totalSetupCosts)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 p-3 bg-surface-2 rounded">
                <span className="font-medium text-sm">Startup Capital:</span>
                <span className="text-lg font-semibold">{formatCurrency(ownersCash)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
                <span className="font-medium">Rental Amount:</span>
                <span className="text-lg">{formatCurrency(data.equipmentRentalAmount)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
                <span className="font-medium">Loan Amount:</span>
                <span className="text-lg">{formatCurrency(data.loanAmount)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 p-3 bg-info/10 rounded font-semibold border-2 border-info/30">
                <span className="font-bold text-xs">Total Funding:</span>
                <span className="text-lg font-bold">{formatCurrency(totalFundingAvailable)}</span>
              </div>
              <div className={`p-2.5 rounded-lg border-2 ${
                surplusShortfall >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-[11px] leading-tight">Funding<br/>Gap</span>
                    <span className={`text-lg font-bold ${
                      surplusShortfall >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatCurrency(Math.abs(surplusShortfall))}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {surplusShortfall >= 0
                      ? 'Available funding exceeds costs'
                      : 'Additional funding needed'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 p-2 rounded">
                <span className="font-bold text-sm">Payments Shown ({period}):</span>
              </div>
              <div className="flex justify-between items-center gap-2 p-3 bg-surface-2 rounded">
                <span className="font-medium text-sm">Rental Payment:</span>
                <span className="text-lg font-semibold">{formatCurrency(
                  period === 'Weekly' ? weeklyRentalCost :
                  period === 'Yearly' ? weeklyRentalCost * 52 :
                  weeklyRentalCost * 52 / 12
                )}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
                <span className="font-medium">Loan:</span>
                <span className="text-lg">{formatCurrency(periodicLoanPayment)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 p-3 bg-muted rounded font-semibold">
                <span className="font-semibold text-sm">Repayments:</span>
                <span className="text-lg font-bold">{formatCurrency(
                  (period === 'Weekly' ? weeklyRentalCost :
                  period === 'Yearly' ? weeklyRentalCost * 52 :
                  weeklyRentalCost * 52 / 12) + periodicLoanPayment
                )}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddCostDialog} onOpenChange={setShowAddCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Cost</DialogTitle>
            <DialogDescription>
              Enter a name for the custom setup cost
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cost-name">Setup Cost Name</Label>
            <Input
              id="cost-name"
              value={newCostName}
              onChange={(e) => setNewCostName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCost()}
              placeholder="e.g., Security System, Landscaping"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomCost}>Add Cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
