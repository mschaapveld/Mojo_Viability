import { useEffect } from 'react';
import { FitoutFinancingColumn, FitoutScenarioData } from '@/features/project/components/FitoutFinancingColumn';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectData, FitoutMode } from '@/lib/types/projectTypes';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';

interface FitoutFinancingProps {
  data: {
    scenario1: FitoutScenarioData;
    scenario2: FitoutScenarioData;
    scenario3: FitoutScenarioData;
  };
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onUpdate: (data: any) => void;
  project?: ProjectData;
  onProjectChange?: (patch: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
}

export function FitoutFinancing({ data, period, onUpdate, project, onProjectChange, onNavigate }: FitoutFinancingProps) {
  const scenarioMode = project?.scenarioMode || 'single';
  const isSingleScenario = scenarioMode === 'single';
  const origin = project?.businessOrigin || 'new';

  const fitoutMode: FitoutMode =
    project?.fitoutMode ??
    (origin === 'existing' ? 'existingBusiness' : 'newFitout');

  useEffect(() => {
    if (!project?.fitoutMode && project?.businessOrigin && onProjectChange) {
      const mode: FitoutMode =
        project.businessOrigin === 'existing' ? 'existingBusiness' : 'newFitout';
      onProjectChange({ fitoutMode: mode });
    }
  }, [project?.fitoutMode, project?.businessOrigin, onProjectChange]);
  const maxCustomCosts = Math.max(
    data.scenario1.customSetupCosts.length,
    data.scenario2.customSetupCosts.length,
    data.scenario3.customSetupCosts.length
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 2. Fitout and Financing</CardTitle>
          <CardDescription className="mt-1">
            {fitoutMode === 'newFitout'
              ? 'Calculate setup costs and loan repayments for your new site'
              : 'Calculate purchase price, upgrade costs and financing for the existing business'}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className={`grid grid-cols-1 ${isSingleScenario ? 'lg:grid-cols-1 max-w-2xl mx-auto' : 'lg:grid-cols-3'} gap-6`}>
        <FitoutFinancingColumn
          scenarioNumber={1}
          data={data.scenario1}
          period={period}
          onUpdate={(updatedData) => onUpdate({ ...data, scenario1: updatedData })}
          maxCustomCosts={maxCustomCosts}
        />
        {!isSingleScenario && (
          <>
            <FitoutFinancingColumn
              scenarioNumber={2}
              data={data.scenario2}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario2: updatedData })}
              maxCustomCosts={maxCustomCosts}
            />
            <FitoutFinancingColumn
              scenarioNumber={3}
              data={data.scenario3}
              period={period}
              onUpdate={(updatedData) => onUpdate({ ...data, scenario3: updatedData })}
              maxCustomCosts={maxCustomCosts}
            />
          </>
        )}
      </div>

      {project && onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.FITOUT_FINANCING}
          onNavigate={onNavigate}
          onUpdate={onProjectChange}
          showPrevious={true}
        />
      )}
    </div>
  );
}
