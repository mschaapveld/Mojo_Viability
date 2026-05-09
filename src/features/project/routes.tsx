import { Navigate } from 'react-router-dom';
import type { ProjectData } from '@/lib/types/projectTypes';
import { useProjectContext } from '@/features/project/components/ProjectLayout';
import { SimpleBreakEven } from '@/features/project/pages/SimpleBreakEvenPage';
import { DetailedBreakEven } from '@/features/project/pages/DetailedBreakEvenPage';
import { FitoutFinancing } from '@/features/project/pages/FitoutFinancingPage';
import { HoursOfOperation } from '@/features/project/pages/HoursOfOperationPage';
import { SalesBreakup } from '@/features/project/pages/SalesBreakupPage';
import { ViabilityMenuBuilder } from '@/features/project/pages/ViabilityMenuBuilderPage';
import { LabourCosting } from '@/features/project/pages/LabourCostingPage';
import LocationSuitability from '@/features/project/pages/LocationSuitabilityPage';
import { SalesPredictions } from '@/features/project/pages/SalesPredictionsPage';
import { BusinessPlanning } from '@/features/project/pages/BusinessPlanningPage';
import { AIBusinessPlan } from '@/features/project/pages/AIBusinessPlanPage';
import BusinessPlanBuilder from '@/features/project/pages/BusinessPlanBuilderPage';

export function ProjectIndexRedirect() {
  return <Navigate to="break-even" replace />;
}

export function SimpleBreakEvenRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <SimpleBreakEven
      data={projectData.simpleBreakEven}
      period={projectData.period}
      onUpdate={(next) => patchProjectData({ simpleBreakEven: next })}
      onNavigateToPlan={() => navigateTab('plan-builder')}
      project={projectData}
      onProjectUpdate={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function DetailedBreakEvenRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <DetailedBreakEven
      data={projectData.detailedBreakEven}
      period={projectData.period}
      onUpdate={(next) => patchProjectData({ detailedBreakEven: next })}
      project={projectData}
      onProjectChange={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function FitoutFinancingRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <FitoutFinancing
      data={projectData.fitoutFinancing}
      period={projectData.period}
      onUpdate={(next) => patchProjectData({ fitoutFinancing: next })}
      project={projectData}
      onProjectChange={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function HoursOfOperationRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <HoursOfOperation
      data={projectData}
      onUpdate={(updates: Partial<ProjectData>) => patchProjectData(updates)}
      project={projectData}
      onNavigate={navigateTab}
    />
  );
}

export function SalesBreakupRoute() {
  const { projectId, projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <SalesBreakup
      projectId={projectId}
      detailedBreakEvenData={projectData.detailedBreakEven}
      period={projectData.period}
      project={projectData}
      onProjectChange={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function ViabilityMenuBuilderRoute() {
  const { projectData, patchProjectData } = useProjectContext();
  return (
    <ViabilityMenuBuilder
      project={projectData}
      onUpdate={(updates) => patchProjectData(updates)}
    />
  );
}

export function LabourCostingRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <LabourCosting
      project={projectData}
      onUpdate={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function LocationSuitabilityRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <LocationSuitability
      project={projectData}
      onUpdate={(updates) => patchProjectData(updates)}
      isLoaded={false}
      onNavigate={navigateTab}
    />
  );
}

export function SalesPredictionsRoute() {
  const { projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <SalesPredictions
      project={projectData}
      onUpdate={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
    />
  );
}

export function BusinessPlanningRoute() {
  const { projectData, patchProjectData } = useProjectContext();
  return (
    <BusinessPlanning
      projectData={projectData}
      onUpdateProject={(updates) => patchProjectData(updates)}
      isLoaded={false}
    />
  );
}

export function AIBusinessPlanRoute() {
  const { projectId, projectData, patchProjectData, navigateTab } = useProjectContext();
  return (
    <AIBusinessPlan
      project={projectData}
      onChange={(updates) => patchProjectData(updates)}
      onNavigate={navigateTab}
      projectId={projectId}
      canEdit={true}
    />
  );
}

export function BusinessPlanBuilderRoute() {
  const { projectId, projectData, patchProjectData } = useProjectContext();
  return (
    <BusinessPlanBuilder
      project={projectData}
      onChange={(updates) => patchProjectData(updates)}
      projectId={projectId}
    />
  );
}
