import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface CustomSetupCost {
  id: string;
  name: string;
  amount: number;
}

interface FitoutFinancingNewProps {
  data: {
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
  };
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: any) => void;
}

export function FitoutFinancingNew({ data, period, onUpdate }: FitoutFinancingNewProps) {
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  const handleCurrencyChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const handlePercentChange = (field: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onUpdate({ ...data, [field]: parseFloat(numericValue) || 0 });
  };

  const formatInputCurrency = (value: number): string => {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const addCustomCost = () => {
    const newCost: CustomSetupCost = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
    };
    onUpdate({ ...data, customSetupCosts: [...(data.customSetupCosts || []), newCost] });
  };

  const removeCustomCost = (id: string) => {
    onUpdate({
      ...data,
      customSetupCosts: data.customSetupCosts.filter((cost) => cost.id !== id),
    });
  };

  const updateCustomCost = (id: string, field: 'name' | 'amount', value: string | number) => {
    onUpdate({
      ...data,
      customSetupCosts: data.customSetupCosts.map((cost) =>
        cost.id === id ? { ...cost, [field]: value } : cost
      ),
    });
  };

  const customCostsTotal = (data.customSetupCosts || []).reduce((sum, cost) => sum + cost.amount, 0);

  const totalSetupCosts =
    data.equipment +
    data.furniture +
    data.tech +
    data.stock +
    data.fitout +
    data.signage +
    (data.designFees || 0) +
    data.legal +
    data.operatingCapital +
    customCostsTotal;

  const ownersCash = data.startupCapital;
  const rentalFinance = data.equipmentRentalAmount;
  const weeklyRentalCost = (data.equipmentRentalAmount / 10000) * 126.92;
  const loanAmount = data.loanAmount;
  const loanInterestRate = data.loanInterest / 100;
  const loanTermMonths = data.loanTerm;
  const balloonAmount = (loanAmount * data.balloonPercent) / 100;
  const principalToFinance = loanAmount - balloonAmount;

  const calculateLoanPayment = () => {
    if (loanAmount === 0 || loanTermMonths === 0) return 0;

    const monthlyRate = loanInterestRate / 12;
    const monthlyPayment = principalToFinance > 0
      ? (principalToFinance * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
      : 0;

    if (period === 'Weekly') {
      return (monthlyPayment * 12) / 52;
    } else if (period === 'Yearly') {
      return monthlyPayment * 12;
    }
    return monthlyPayment;
  };

  const periodicLoanPayment = calculateLoanPayment();
  const totalInterest = periodicLoanPayment * loanTermMonths - principalToFinance;
  const totalRepayment = principalToFinance + totalInterest + balloonAmount;

  const surplusShortfall = ownersCash + rentalFinance + loanAmount - totalSetupCosts;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle>Setup Costs - New Build</CardTitle>
          <CardDescription>Enter all your startup costs</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="equipment">Equipment</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="equipment"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.equipment)}
                onChange={(e) => handleCurrencyChange('equipment', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="furniture">Furniture & Fittings</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="furniture"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.furniture)}
                onChange={(e) => handleCurrencyChange('furniture', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tech">Tech & POS</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="tech"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.tech)}
                onChange={(e) => handleCurrencyChange('tech', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="stock">Initial Stock</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="stock"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.stock)}
                onChange={(e) => handleCurrencyChange('stock', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="fitout">Fitout & Renovations</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="fitout"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.fitout)}
                onChange={(e) => handleCurrencyChange('fitout', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="signage">Signage & Branding</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="signage"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.signage)}
                onChange={(e) => handleCurrencyChange('signage', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="designFees">Design Fees</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="designFees"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.designFees || 0)}
                onChange={(e) => handleCurrencyChange('designFees', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="legal">Legal & Licenses</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="legal"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.legal)}
                onChange={(e) => handleCurrencyChange('legal', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="operatingCapital">Operating Capital Reserve</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="operatingCapital"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.operatingCapital)}
                onChange={(e) => handleCurrencyChange('operatingCapital', e.target.value)}
              />
            </div>
          </div>

          {(data.customSetupCosts || []).map((cost) => (
            <div key={cost.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor={`custom-name-${cost.id}`}>Custom Item</Label>
                <Input
                  id={`custom-name-${cost.id}`}
                  type="text"
                  placeholder="Item name"
                  value={cost.name}
                  onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`custom-amount-${cost.id}`}>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id={`custom-amount-${cost.id}`}
                    type="text"
                    className="pl-7"
                    value={formatInputCurrency(cost.amount)}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                      updateCustomCost(cost.id, 'amount', parseFloat(numericValue) || 0);
                    }}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCustomCost(cost.id)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addCustomCost}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Cost
          </Button>

          <div className="flex justify-between items-center gap-4 p-3 bg-info/10 rounded font-semibold border-2 border-info/30 mt-4">
            <span className="font-bold whitespace-nowrap">Total Cost:</span>
            <span className="text-lg font-bold whitespace-nowrap">{formatCurrency(totalSetupCosts)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted rounded-t-lg">
          <CardTitle>Financing</CardTitle>
          <CardDescription>How will you fund the setup?</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="startupCapital">Owner's Cash Contribution</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="startupCapital"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.startupCapital)}
                onChange={(e) => handleCurrencyChange('startupCapital', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="equipmentRentalAmount">Equipment Rental/Finance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="equipmentRentalAmount"
                type="text"
                className="pl-7"
                value={formatInputCurrency(data.equipmentRentalAmount)}
                onChange={(e) => handleCurrencyChange('equipmentRentalAmount', e.target.value)}
              />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Weekly Rental Cost: {formatCurrency(weeklyRentalCost)}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="loanAmount"
                    type="text"
                    className="pl-7"
                    value={formatInputCurrency(data.loanAmount)}
                    onChange={(e) => handleCurrencyChange('loanAmount', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="loanInterest">Interest Rate (%)</Label>
                  <Input
                    id="loanInterest"
                    type="text"
                    value={data.loanInterest}
                    onChange={(e) => handlePercentChange('loanInterest', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanTerm">Term (months)</Label>
                  <Input
                    id="loanTerm"
                    type="text"
                    value={data.loanTerm}
                    onChange={(e) => handlePercentChange('loanTerm', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="balloonPercent">Balloon (%)</Label>
                  <Input
                    id="balloonPercent"
                    type="text"
                    value={data.balloonPercent}
                    onChange={(e) => handlePercentChange('balloonPercent', e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowLoanDetails(!showLoanDetails)}
                className="w-full"
              >
                {showLoanDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Loan Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Loan Details
                  </>
                )}
              </Button>

              {showLoanDetails && (
                <div className="space-y-3 p-4 bg-surface-2 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Principal to Finance:</span>
                    <span className="font-medium">{formatCurrency(principalToFinance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balloon Payment:</span>
                    <span className="font-medium">{formatCurrency(balloonAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{period} Payment:</span>
                    <span className="font-medium">{formatCurrency(periodicLoanPayment)}</span>
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-info/30">
        <CardHeader className="bg-info/10 rounded-t-lg">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Total Setup Costs:</span>
              <span className="text-lg">{formatCurrency(totalSetupCosts)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Owner's Cash Contribution:</span>
              <span className="text-lg">{formatCurrency(ownersCash)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Equipment Rental/Finance ({period}):</span>
              <span className="text-lg">{formatCurrency(
                period === 'Weekly' ? weeklyRentalCost :
                period === 'Yearly' ? weeklyRentalCost * 52 :
                weeklyRentalCost * 52 / 12
              )}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-2 rounded">
              <span className="font-medium">Loan ({period}):</span>
              <span className="text-lg">{formatCurrency(periodicLoanPayment)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded font-semibold">
              <span className="font-semibold">Total Repayments ({period}):</span>
              <span className="text-lg">{formatCurrency(
                (period === 'Weekly' ? weeklyRentalCost :
                period === 'Yearly' ? weeklyRentalCost * 52 :
                weeklyRentalCost * 52 / 12) + periodicLoanPayment
              )}</span>
            </div>
            <div className={`p-4 rounded-lg border-2 ${
              surplusShortfall >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">Funding Gap</span>
                  <Info className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <span className={`text-2xl font-bold ${
                  surplusShortfall >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatCurrency(Math.abs(surplusShortfall))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {surplusShortfall >= 0
                  ? 'Available funding exceeds total setup costs'
                  : 'Additional funding needed to cover setup costs'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
