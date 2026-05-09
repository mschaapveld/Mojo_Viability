import { useState, useEffect } from 'react';
import { ProjectData } from '@/lib/types/projectTypes';
import { calculateProjectSummary } from '@/lib/calculations/projectSummary';
import { evaluateViability, StatusLevel } from '@/lib/calculations/summaryViability';
import { evaluateHourlySalesBenchmark, venueTypeLabel } from '@/lib/calculations/hourlyBenchmarks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface BusinessSnapshotProps {
  projectData: ProjectData;
  onNavigateToDetailed?: () => void;
}

export function BusinessSnapshot({ projectData, onNavigateToDetailed }: BusinessSnapshotProps) {
  const [isVisible, setIsVisible] = useState(() => {
    const stored = localStorage.getItem('businessSnapshotVisible');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('businessSnapshotVisible', String(isVisible));
  }, [isVisible]);

  const summary = calculateProjectSummary(projectData);
  const viability = evaluateViability(summary);

  // Check if we have data to display
  const hasData = summary.dataSource !== "none";


  const getStatusIcon = (status: StatusLevel) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'borderline':
        return <AlertTriangle className="h-5 w-5 text-warning-foreground" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusTextColor = (status: StatusLevel) => {
    switch (status) {
      case 'good':
        return 'text-success';
      case 'borderline':
        return 'text-warning-foreground';
      case 'bad':
        return 'text-destructive';
    }
  };

  const getStatusBgColor = (status: StatusLevel) => {
    switch (status) {
      case 'good':
        return 'bg-success/10 border-success/30';
      case 'borderline':
        return 'bg-warning/10 border-warning/30';
      case 'bad':
        return 'bg-destructive/10 border-destructive/30';
    }
  };

  const getRecommendationBarClasses = (status: StatusLevel) => {
    switch (status) {
      case 'good':
        return 'bg-success/10 border-success/30 text-success';
      case 'borderline':
        return 'bg-warning/10 border-warning/30 text-warning-foreground';
      case 'bad':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Business Snapshot</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="h-8 w-8 p-0 hover:bg-accent"
            title={isVisible ? "Hide snapshot" : "Show snapshot"}
          >
            {isVisible ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
        {hasData && isVisible && (
          <Badge variant="outline" className="text-xs">
            {summary.dataSource === "detailed" ? "Using Detailed Break-Even" : "Using Simple Break-Even"}
          </Badge>
        )}
      </div>

      {!isVisible && (
        <div className="text-sm text-muted-foreground italic">
          Click the arrow to show the Business Snapshot
        </div>
      )}

      {isVisible && (
        <div className="relative">

      {summary.isAssumptionHeavy && hasData && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-warning-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning-foreground">
            <strong>Assumption-heavy:</strong> Some key inputs are missing. Results may not be fully accurate.
          </p>
        </div>
      )}

      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center px-8 py-12 max-w-md">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-info/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-semibold text-foreground mb-3">
              Check High-Level Viability
            </h3>
            <p className="text-xl text-muted-foreground">
              Start with a Simple Break-Even analysis to see if your numbers make sense
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className={`metric-card ${getStatusBgColor(viability.breakEvenStatus)}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Break-Even Sales</p>
            {getStatusIcon(viability.breakEvenStatus)}
          </div>
          <p className={`text-left text-2xl font-semibold tabular-nums mb-2 ${getStatusTextColor(viability.breakEvenStatus)}`}>
            {formatCurrency(summary.requiredSalesToBreakEven)}
          </p>
          <p className="text-left text-xs text-muted-foreground leading-snug">
            {viability.breakEvenMessage}
          </p>
        </div>

        <div className="metric-card">
          <div className="mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Sales to Pay Owner</p>
          </div>
          <p className="text-left text-2xl font-semibold tabular-nums text-info mb-2">
            {formatCurrency(summary.requiredSalesToPayOwner)}
          </p>
          <p className="text-left text-xs text-muted-foreground">
            Revenue needed to cover all costs and pay yourself
          </p>
        </div>

        <div className={`metric-card ${getStatusBgColor(viability.hourlyStatus)}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Required $/Hour</p>
            {getStatusIcon(viability.hourlyStatus)}
          </div>
          <p className={`text-left text-2xl font-semibold tabular-nums mb-2 ${getStatusTextColor(viability.hourlyStatus)}`}>
            {summary.requiredSalesPerTradingHour != null
              ? formatCurrency(summary.requiredSalesPerTradingHour)
              : '—'}
          </p>
          <p className="text-left text-xs text-muted-foreground leading-snug">
            {viability.hourlyMessage}
          </p>
          {summary.requiredSalesPerTradingHour && projectData.venueType && (() => {
            const bench = evaluateHourlySalesBenchmark(
              projectData.venueType,
              summary.requiredSalesPerTradingHour
            );
            return bench ? (
              <p className="text-[11px] text-muted-foreground mt-1">
                {venueTypeLabel(projectData.venueType)}: {bench.band.label} range
              </p>
            ) : null;
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="metric-card">
          <div className="mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Fixed Costs</p>
          </div>
          <p className="text-left text-2xl font-semibold tabular-nums text-foreground mb-2">
            {formatCurrency(summary.totalFixedCosts)}
          </p>
          <p className="text-left text-xs text-muted-foreground">
            Rent, labour minimums, and other fixed expenses
          </p>
        </div>

        <div className={`metric-card ${getStatusBgColor(viability.fundingStatus)}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Fitout & Funding</p>
            {getStatusIcon(viability.fundingStatus)}
          </div>
          <div className="space-y-1 mb-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Total Fitout:</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(summary.totalFitoutCost)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Funding Gap:</span>
              <span className={`text-sm font-semibold tabular-nums ${summary.fundingGap > 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(Math.abs(summary.fundingGap))}
                <span className="text-xs ml-1">
                  {summary.fundingGap > 0 ? 'short' : 'surplus'}
                </span>
              </span>
            </div>
          </div>
          <p className="text-left text-xs text-muted-foreground leading-snug">
            {viability.fundingMessage}
          </p>
        </div>

        <div className={`metric-card ${getStatusBgColor(viability.overallStatus)}`}>
          <div className="mb-3">
            <p className="text-left text-muted-foreground text-base font-semibold">Mojo Viability Signal</p>
          </div>

          <div className="mb-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                viability.overallStatus === 'good'
                  ? 'bg-success text-success-foreground'
                  : viability.overallStatus === 'borderline'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              {viability.overallLabel}
            </span>
          </div>

          <p className="text-left text-xs text-muted-foreground leading-snug mb-3">
            {viability.overallMessage}
          </p>

          {onNavigateToDetailed && (
            <Button
              onClick={onNavigateToDetailed}
              size="sm"
              className="w-full text-xs bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              Let's Build a Plan
            </Button>
          )}
        </div>
      </div>

      <div className={`p-4 rounded-lg border-2 ${getRecommendationBarClasses(viability.overallStatus)}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(viability.overallStatus)}
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">Recommendation</p>
            <p className="text-sm leading-relaxed">
              {viability.recommendation}
            </p>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
