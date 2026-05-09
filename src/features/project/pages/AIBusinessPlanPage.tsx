import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Sparkles,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Download,
  FileUp,
  Edit3,
  ArrowRight,
  Mail,
} from 'lucide-react';
import {
  ProjectData,
  BusinessPlanType,
  BusinessPlanData,
  BusinessPlanIntakeStep,
  BusinessTypeClassification,
  BusinessStructure,
  POSSystem,
  AccountingSystem,
  OrderingModel,
  VenueType,
} from '@/lib/types/projectTypes';
import {
  checkBusinessPlanReadiness,
  getScenarioLabel,
} from '@/lib/calculations/businessPlanReadiness';
import {
  generateSimplePlan,
  generateDetailedPlan,
  identifyOpportunities,
} from '@/lib/calculations/businessPlanGenerator';
import { getLiquorLicencesForState, extractStateFromAddress } from '@/lib/liquorLicences';
import { HoursScheduleChart } from '@/components/shared/HoursScheduleChart';
import { ContentUploadsPanel } from '@/features/project/components/ContentUploadsPanel';

interface AIBusinessPlanProps {
  project: ProjectData;
  onChange: (patch: Partial<ProjectData>) => void;
  onNavigate?: (tab: string) => void;
  projectId?: string | null;
  canEdit?: boolean;
}

const INTAKE_STEPS_SIMPLE: BusinessPlanIntakeStep[] = [
  'planTypeSelection',
  'coreDetails',
  'technologyStack',
  'review',
];

const INTAKE_STEPS_DETAILED: BusinessPlanIntakeStep[] = [
  'planTypeSelection',
  'coreDetails',
  'fundingFinance',
  'operatorExperience',
  'professionalServices',
  'technologyStack',
  'operationalReadiness',
  'ownership',
  'review',
];

const BUSINESS_CATEGORIES: { value: BusinessTypeClassification; label: string }[] = [
  { value: 'Burger', label: 'Burger' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Taco', label: 'Taco/Mexican' },
  { value: 'Cafe', label: 'Cafe/Brunch' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Pub', label: 'Pub' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Sushi', label: 'Japanese/Sushi' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'IceCream', label: 'Ice Cream/Dessert' },
  { value: 'JuiceBar', label: 'Juice Bar' },
  { value: 'Other', label: 'Other' },
];

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'Small bar', label: 'Small bar' },
  { value: 'Small restaurant', label: 'Small restaurant' },
  { value: 'Small restaurant with bar', label: 'Small restaurant with bar' },
  { value: 'Medium restaurant', label: 'Medium restaurant' },
  { value: 'Large restaurant', label: 'Large restaurant' },
  { value: 'Live music venue', label: 'Live music venue' },
  { value: 'Nightclub', label: 'Nightclub' },
  { value: 'Pub / Tavern', label: 'Pub / Tavern' },
  { value: 'Cafe', label: 'Cafe' },
  { value: 'Quick service restaurant (QSR)', label: 'Quick service restaurant (QSR)' },
];

const STRENGTH_OPTIONS = [
  'Operations & Service',
  'Financial Management',
  'Marketing & Branding',
  'Leadership & Team Building',
  'Menu Development',
  'Customer Experience',
  'Systems & Technology',
];

function BusinessPlanContent({
  html,
  hoursVisualizationData,
  hasServiceShifts,
}: {
  html: string;
  hoursVisualizationData: any;
  hasServiceShifts: boolean;
}) {
  const placeholderText = '<div id="hours-visualization-placeholder" data-component="hours-schedule-chart"></div>';

  if (!html.includes(placeholderText)) {
    return (
      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  const parts = html.split(placeholderText);

  return (
    <div className="prose prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: parts[0] }} />

      {hoursVisualizationData && (
        <div>
          <HoursScheduleChart
            data={hoursVisualizationData}
            mode="detailed"
            showModeToggle={false}
            showLegend={hasServiceShifts}
            showTotals={true}
            timeFormat="12h"
          />
        </div>
      )}

      {parts[1] && <div dangerouslySetInnerHTML={{ __html: parts[1] }} />}
    </div>
  );
}

export function AIBusinessPlan({ project, onChange, onNavigate: _onNavigate, projectId, canEdit = true }: AIBusinessPlanProps) {
  const bp = project.businessPlan || {};
  const [activeScenario, setActiveScenario] = useState<'scenario1' | 'scenario2' | 'scenario3'>(
    bp.activeScenario || 'scenario1'
  );
  const [currentStep, setCurrentStep] = useState<BusinessPlanIntakeStep>(
    bp.intakeStep || 'planTypeSelection'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPDF = async () => {
    const { exportBusinessPlanPDF } = await import('@/lib/export/exportBusinessPlan');
    const businessName = bp.brandName || project.siteName || 'Business Plan';

    await exportBusinessPlanPDF({
      planHtml: bp.generatedPlanHtml || '',
      businessName,
      hoursData: bp.hoursVisualizationData,
      hasServiceShifts: bp.hasServiceShifts || false,
    });
  };

  const handleExportWord = async () => {
    const { exportBusinessPlanWord } = await import('@/lib/export/exportBusinessPlan');
    const businessName = bp.brandName || project.siteName || 'Business Plan';

    await exportBusinessPlanWord({
      planHtml: bp.generatedPlanHtml || '',
      businessName,
      hoursData: bp.hoursVisualizationData,
      hasServiceShifts: bp.hasServiceShifts || false,
    });
  };

  const handleProceedToDetailed = () => {
    updateBusinessPlan({
      planType: 'detailed',
      intakeStep: 'coreDetails',
      generatedPlanHtml: null,
      generatedAt: null,
      intakeComplete: false,
    });
    setCurrentStep('coreDetails');
  };

  const handleUpdateSimple = () => {
    updateBusinessPlan({
      planType: 'simple',
      intakeStep: 'coreDetails',
      generatedPlanHtml: null,
      generatedAt: null,
      intakeComplete: false,
    });
    setCurrentStep('coreDetails');
  };

  const readiness = checkBusinessPlanReadiness(project, activeScenario);
  const planType = bp.planType;
  const intakeSteps = planType === 'detailed' ? INTAKE_STEPS_DETAILED : INTAKE_STEPS_SIMPLE;
  const currentStepIndex = intakeSteps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / intakeSteps.length) * 100;

  const updateBusinessPlan = (patch: Partial<BusinessPlanData>) => {
    onChange({
      businessPlan: {
        ...bp,
        ...patch,
      },
    });
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < intakeSteps.length) {
      const nextStep = intakeSteps[nextIndex];
      setCurrentStep(nextStep);
      updateBusinessPlan({ intakeStep: nextStep });
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = intakeSteps[prevIndex];
      setCurrentStep(prevStep);
      updateBusinessPlan({ intakeStep: prevStep });
    }
  };

  const handlePlanTypeSelection = (type: BusinessPlanType) => {
    updateBusinessPlan({
      planType: type,
      intakeStep: 'coreDetails',
    });
    setCurrentStep('coreDetails');
  };

  const handleGeneratePlan = async () => {
    if (!readiness.canGeneratePlan) return;

    setIsGenerating(true);

    const opportunities = identifyOpportunities(project);
    updateBusinessPlan({ opportunities });

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (bp.planType === 'detailed') {
      const planData = await generateDetailedPlan(project, activeScenario, projectId);
      updateBusinessPlan({
        generatedPlanHtml: planData.html,
        generatedAt: new Date().toISOString(),
        intakeComplete: true,
        activeScenario,
        hoursVisualizationData: planData.hoursVisualizationData,
        hasServiceShifts: planData.hasServiceShifts,
      } as any);
    } else {
      const planHtml = generateSimplePlan(project, activeScenario);
      updateBusinessPlan({
        generatedPlanHtml: planHtml,
        generatedAt: new Date().toISOString(),
        intakeComplete: true,
        activeScenario,
      });
    }

    setIsGenerating(false);
  };

  const hasKnownData = (field: string): boolean => {
    switch (field) {
      case 'brandName': return !!(bp.brandName || project.siteName);
      case 'address': return !!(project.siteAddress || project.location?.address);
      case 'businessCategory': return !!(bp.businessCategory || project.venueType);
      default: return false;
    }
  };

  const renderPlanTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Choose Your Business Plan Type</h2>
        <p className="text-sm text-muted-foreground">Select the level of detail you need for your business plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:border-brand/40 hover:shadow-md transition-all"
          onClick={() => handlePlanTypeSelection('simple')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-info" />
              Simple Business Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Concise overview of your business</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Clear viability assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Key assumptions documented</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Fewer questions, faster to complete</span>
              </li>
            </ul>
            <Badge variant="outline" className="mt-4">Best for: Quick overview</Badge>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-brand/40 hover:shadow-md transition-all"
          onClick={() => handlePlanTypeSelection('detailed')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-info" />
              Detailed Business Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Comprehensive business documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Suitable for banks and investors</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Landlord presentation ready</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Risk analysis and mitigation</span>
              </li>
            </ul>
            <Badge variant="outline" className="mt-4">Best for: Finance applications</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCoreDetails = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Core Business Details</h2>
        <p className="text-sm text-muted-foreground">We've pre-filled what we know. Review and add any missing information.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">Business/Brand Name</Label>
          {hasKnownData('brandName') && (
            <Badge variant="outline" className="ml-2 text-xs text-success">Pre-filled</Badge>
          )}
          <Input
            value={bp.brandName || project.siteName || ''}
            onChange={(e) => updateBusinessPlan({ brandName: e.target.value })}
            placeholder="e.g., The Corner Cafe"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">Site Address</Label>
          {hasKnownData('address') && (
            <Badge variant="outline" className="ml-2 text-xs text-success">Pre-filled</Badge>
          )}
          <Input
            value={project.siteAddress || project.location?.address || ''}
            disabled
            className="mt-1 bg-surface-2"
          />
          <p className="text-xs text-muted-foreground/60 mt-1">Address is set in the Site Details step</p>
        </div>

        <div>
          <Label className="text-sm">Business Category</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={bp.businessCategory || ''}
            onChange={(e) => updateBusinessPlan({ businessCategory: e.target.value as BusinessTypeClassification })}
          >
            <option value="">Select category...</option>
            {BUSINESS_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-sm">
            Venue Type
            <span className="text-destructive ml-1">*</span>
          </Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={project.detailedBreakEven[activeScenario].venueType || ''}
            onChange={(e) => {
              const venueType = e.target.value as VenueType;
              onChange({
                detailedBreakEven: {
                  ...project.detailedBreakEven,
                  [activeScenario]: {
                    ...project.detailedBreakEven[activeScenario],
                    venueType: venueType || null,
                  },
                },
              });
            }}
          >
            <option value="">Select venue type...</option>
            {VENUE_TYPES.map(venue => (
              <option key={venue.value} value={venue.value}>{venue.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Venue classification for business planning (replaces technical size metrics in Simple Plan)
          </p>
        </div>

        <div>
          <Label className="text-sm">Business Concept</Label>
          <Textarea
            value={bp.businessConcept || ''}
            onChange={(e) => updateBusinessPlan({ businessConcept: e.target.value })}
            placeholder="Briefly describe your business concept and what makes it unique..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-sm">Target Market</Label>
          <Textarea
            value={bp.targetMarket || ''}
            onChange={(e) => updateBusinessPlan({ targetMarket: e.target.value })}
            placeholder="Who are your ideal customers? e.g., Young professionals, families, students..."
            className="mt-1"
            rows={2}
          />
        </div>

        {planType === 'detailed' && (
          <div>
            <Label className="text-sm">Unique Selling Points</Label>
            <Textarea
              value={bp.uniqueSellingPoints || ''}
              onChange={(e) => updateBusinessPlan({ uniqueSellingPoints: e.target.value })}
              placeholder="What sets your business apart from competitors?"
              className="mt-1"
              rows={2}
            />
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Licensing & Compliance</h3>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Will the venue be licensed to serve alcohol?</Label>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => updateBusinessPlan({ willServeAlcohol: true })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                    bp.willServeAlcohol === true
                      ? 'bg-brand/5 border-brand text-brand'
                      : 'bg-card border-border text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateBusinessPlan({ willServeAlcohol: false, liquorLicenceType: null, liquorLicenceOtherText: null })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                    bp.willServeAlcohol === false
                      ? 'bg-brand/5 border-brand text-brand'
                      : 'bg-card border-border text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm">Will the venue have gaming machines and other betting?</Label>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => updateBusinessPlan({ willHaveGamingOrBetting: true })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                    bp.willHaveGamingOrBetting === true
                      ? 'bg-brand/5 border-brand text-brand'
                      : 'bg-card border-border text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateBusinessPlan({ willHaveGamingOrBetting: false })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                    bp.willHaveGamingOrBetting === false
                      ? 'bg-brand/5 border-brand text-brand'
                      : 'bg-card border-border text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {planType === 'detailed' && bp.willServeAlcohol === true && (
              <div>
                <Label className="text-sm">Which liquor licence will the venue apply for?</Label>
                {(() => {
                  const address = project.siteAddress || project.location?.address;
                  const state = extractStateFromAddress(address);
                  const licenceOptions = getLiquorLicencesForState(state);

                  if (!state && address) {
                    return (
                      <div className="mt-2 p-3 bg-warning/10 border border-warning/30 rounded-md text-sm text-warning">
                        Unable to determine state from address. Please confirm the address includes the state (e.g., NSW, VIC, QLD).
                      </div>
                    );
                  }

                  if (!address) {
                    return (
                      <div className="mt-2 p-3 bg-warning/10 border border-warning/30 rounded-md text-sm text-warning">
                        Please set the site address in the Site Details step first.
                      </div>
                    );
                  }

                  return (
                    <>
                      <select
                        className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={bp.liquorLicenceType || ''}
                        onChange={(e) => updateBusinessPlan({
                          liquorLicenceType: e.target.value,
                          liquorLicenceOtherText: e.target.value === 'other' ? bp.liquorLicenceOtherText : null
                        })}
                      >
                        <option value="">Select licence type...</option>
                        {licenceOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {state && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Showing licence types for {state}
                        </p>
                      )}
                      {bp.liquorLicenceType === 'other' && (
                        <div className="mt-3">
                          <Label className="text-xs">Please specify the licence type</Label>
                          <Input
                            value={bp.liquorLicenceOtherText || ''}
                            onChange={(e) => updateBusinessPlan({ liquorLicenceOtherText: e.target.value })}
                            placeholder="Enter licence type..."
                            className="mt-1"
                          />
                        </div>
                      )}
                      {bp.liquorLicenceType === 'not-sure' && (
                        <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded-md text-xs text-info">
                          Recommendation: Confirm the licence type with your state's liquor licensing authority before finalising your business plan.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFundingFinance = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Funding & Finance</h2>
        <p className="text-sm text-muted-foreground">This information is pulled from your Fitout & Financing data.</p>
      </div>

      <Card className="border-border bg-surface-2">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Startup Capital</span>
              <p className="font-medium">${project.fitoutFinancing[activeScenario].startupCapital.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Loan Amount</span>
              <p className="font-medium">${project.fitoutFinancing[activeScenario].loanAmount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Owner's Capital</span>
              <p className="font-medium">${(project.fitoutFinancing[activeScenario].startupCapital - project.fitoutFinancing[activeScenario].loanAmount).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Occupancy Type</span>
              <p className="font-medium capitalize">{project.detailedBreakEven[activeScenario].occupancyType || 'Renting'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-4">
            To change these values, go back to the Fitout & Financing step.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderOperatorExperience = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Your Experience & Capability</h2>
        <p className="text-sm text-muted-foreground">This helps demonstrate your readiness to operate the business.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Years in Hospitality</Label>
            <Input
              type="number"
              value={bp.operatorExperience?.hospitalityExperienceYears || ''}
              onChange={(e) => updateBusinessPlan({
                operatorExperience: {
                  ...bp.operatorExperience,
                  hospitalityExperienceYears: parseInt(e.target.value) || null,
                },
              })}
              placeholder="e.g., 5"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Years in Management</Label>
            <Input
              type="number"
              value={bp.operatorExperience?.managementExperienceYears || ''}
              onChange={(e) => updateBusinessPlan({
                operatorExperience: {
                  ...bp.operatorExperience,
                  managementExperienceYears: parseInt(e.target.value) || null,
                },
              })}
              placeholder="e.g., 3"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">Relevant Experience</Label>
          <Textarea
            value={bp.operatorExperience?.relevantExperienceDescription || ''}
            onChange={(e) => updateBusinessPlan({
              operatorExperience: {
                ...bp.operatorExperience,
                relevantExperienceDescription: e.target.value,
              },
            })}
            placeholder="Describe your relevant work history and qualifications..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-sm mb-2 block">Key Strengths (select all that apply)</Label>
          <div className="grid grid-cols-2 gap-2">
            {STRENGTH_OPTIONS.map(strength => {
              const isSelected = bp.operatorExperience?.strengths?.includes(strength);
              return (
                <button
                  key={strength}
                  type="button"
                  onClick={() => {
                    const current = bp.operatorExperience?.strengths || [];
                    const updated = isSelected
                      ? current.filter(s => s !== strength)
                      : [...current, strength];
                    updateBusinessPlan({
                      operatorExperience: {
                        ...bp.operatorExperience,
                        strengths: updated,
                      },
                    });
                  }}
                  className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                    isSelected
                      ? 'bg-brand/5 border-brand text-brand'
                      : 'bg-card border-border text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  {strength}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfessionalServices = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Professional Services</h2>
        <p className="text-sm text-muted-foreground">Having the right advisers in place strengthens your business plan.</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'hasAccountant', nameKey: 'accountantName', label: 'Accountant' },
          { key: 'hasLawyer', nameKey: 'lawyerName', label: 'Lawyer/Solicitor' },
          { key: 'hasBookkeeper', nameKey: 'bookkeeperName', label: 'Bookkeeper' },
          { key: 'hasFinanceBroker', nameKey: 'financeBrokerName', label: 'Finance Broker' },
        ].map(service => (
          <div key={service.key} className="flex items-start gap-4 p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="text-sm">{service.label}</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={service.key}
                    checked={bp.professionalServices?.[service.key as keyof typeof bp.professionalServices] === true}
                    onChange={() => updateBusinessPlan({
                      professionalServices: {
                        ...bp.professionalServices,
                        [service.key]: true,
                      },
                    })}
                    className="text-info"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={service.key}
                    checked={bp.professionalServices?.[service.key as keyof typeof bp.professionalServices] === false}
                    onChange={() => updateBusinessPlan({
                      professionalServices: {
                        ...bp.professionalServices,
                        [service.key]: false,
                      },
                    })}
                    className="text-info"
                  />
                  Not yet
                </label>
              </div>
              {bp.professionalServices?.[service.key as keyof typeof bp.professionalServices] === true && (
                <Input
                  value={bp.professionalServices?.[service.nameKey as keyof typeof bp.professionalServices] as string || ''}
                  onChange={(e) => updateBusinessPlan({
                    professionalServices: {
                      ...bp.professionalServices,
                      [service.nameKey]: e.target.value,
                    },
                  })}
                  placeholder={`${service.label} name (optional)`}
                  className="mt-2 text-sm"
                />
              )}
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">Need help finding professional services?</p>
              <p className="text-xs text-warning mt-1">
                Mojo can connect you with hospitality-experienced accountants, lawyers, and brokers.
              </p>
              <label className="flex items-center gap-2 mt-2 text-sm text-warning">
                <input
                  type="checkbox"
                  checked={bp.professionalServices?.needsHelpSourcingServices || false}
                  onChange={(e) => updateBusinessPlan({
                    professionalServices: {
                      ...bp.professionalServices,
                      needsHelpSourcingServices: e.target.checked,
                    },
                  })}
                  className="text-warning"
                />
                Yes, I'd like help sourcing services
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechnologyStack = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Technology & Systems</h2>
        <p className="text-sm text-muted-foreground">The systems you'll use to run your business.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">POS System</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={bp.technologyStack?.posSystem || ''}
            onChange={(e) => updateBusinessPlan({
              technologyStack: {
                ...bp.technologyStack,
                posSystem: e.target.value as POSSystem,
                posSystemOther: e.target.value === 'other' ? bp.technologyStack?.posSystemOther : null,
              },
            })}
          >
            <option value="">Select POS system...</option>
            <option value="abacus">Abacus</option>
            <option value="bepoz">Bepoz</option>
            <option value="clover">Clover</option>
            <option value="idealpos">Idealpos</option>
            <option value="imagatec">Imagatec iPos</option>
            <option value="impos">Impos</option>
            <option value="kounta">Kounta</option>
            <option value="lightspeed">Lightspeed</option>
            <option value="ordermate">OrderMate</option>
            <option value="revel">Revel</option>
            <option value="square">Square</option>
            <option value="swiftpos">SwiftPos</option>
            <option value="toast">Toast</option>
            <option value="other">Other</option>
            <option value="undecided">Not decided yet</option>
          </select>
        </div>

        {bp.technologyStack?.posSystem === 'other' && (
          <div>
            <Label className="text-sm">POS System Name</Label>
            <Input
              className="mt-1"
              placeholder="Enter POS system name"
              value={bp.technologyStack?.posSystemOther || ''}
              onChange={(e) => updateBusinessPlan({
                technologyStack: {
                  ...bp.technologyStack,
                  posSystemOther: e.target.value,
                },
              })}
            />
          </div>
        )}

        <div>
          <Label className="text-sm">Ordering Model</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={bp.technologyStack?.orderingModel || ''}
            onChange={(e) => updateBusinessPlan({
              technologyStack: {
                ...bp.technologyStack,
                orderingModel: e.target.value as OrderingModel,
              },
            })}
          >
            <option value="">Select ordering model...</option>
            <option value="inStoreOnly">In-store only</option>
            <option value="onlineOrdering">Online ordering (website)</option>
            <option value="appOrdering">App ordering</option>
            <option value="aggregatorOnly">Aggregator only (Uber Eats, etc.)</option>
            <option value="mixed">Mixed (multiple channels)</option>
          </select>
        </div>

        {(bp.technologyStack?.orderingModel === 'aggregatorOnly' || bp.technologyStack?.orderingModel === 'mixed') && (
          <div>
            <Label className="text-sm">Aggregators Used</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Uber Eats', 'DoorDash', 'Menulog', 'Deliveroo'].map(agg => {
                const isSelected = bp.technologyStack?.aggregatorsUsed?.includes(agg);
                return (
                  <button
                    key={agg}
                    type="button"
                    onClick={() => {
                      const current = bp.technologyStack?.aggregatorsUsed || [];
                      const updated = isSelected
                        ? current.filter(a => a !== agg)
                        : [...current, agg];
                      updateBusinessPlan({
                        technologyStack: {
                          ...bp.technologyStack,
                          aggregatorsUsed: updated,
                        },
                      });
                    }}
                    className={`text-sm px-3 py-2 rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-brand/5 border-brand text-brand'
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    {agg}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm">Accounting System</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={bp.technologyStack?.accountingSystem || ''}
            onChange={(e) => updateBusinessPlan({
              technologyStack: {
                ...bp.technologyStack,
                accountingSystem: e.target.value as AccountingSystem,
              },
            })}
          >
            <option value="">Select accounting system...</option>
            <option value="xero">Xero</option>
            <option value="myob">MYOB</option>
            <option value="quickbooks">QuickBooks</option>
            <option value="other">Other</option>
            <option value="undecided">Not decided yet</option>
          </select>
        </div>

        {(project.detailedBreakEven[activeScenario].venueType === 'Small restaurant' ||
          project.detailedBreakEven[activeScenario].venueType === 'Small restaurant with bar' ||
          project.detailedBreakEven[activeScenario].venueType === 'Medium restaurant' ||
          project.detailedBreakEven[activeScenario].venueType === 'Large restaurant' ||
          project.detailedBreakEven[activeScenario].venueType === 'Small bar' ||
          project.detailedBreakEven[activeScenario].venueType === 'Pub / Tavern') && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="text-sm">Will the venue take bookings?</Label>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  This helps us understand your service model and operating systems.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="takesBookings"
                      checked={bp.technologyStack?.takesBookings === true}
                      onChange={() => updateBusinessPlan({
                        technologyStack: {
                          ...bp.technologyStack,
                          takesBookings: true,
                        },
                      })}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="takesBookings"
                      checked={bp.technologyStack?.takesBookings === false}
                      onChange={() => updateBusinessPlan({
                        technologyStack: {
                          ...bp.technologyStack,
                          takesBookings: false,
                          bookingSystemType: null,
                        },
                      })}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {bp.technologyStack?.takesBookings === true && (
              <div className="p-3 border rounded-lg bg-surface-2">
                <Label className="text-sm">Which booking system will you use?</Label>
                <select
                  className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={bp.technologyStack?.bookingSystemType || ''}
                  onChange={(e) => updateBusinessPlan({
                    technologyStack: {
                      ...bp.technologyStack,
                      bookingSystemType: e.target.value,
                    },
                  })}
                >
                  <option value="">Select booking system...</option>
                  <option value="manual">No system – manual reservation diary</option>
                  <option value="nowbookit">NowBookit</option>
                  <option value="opentable">OpenTable</option>
                  <option value="quandoo">Quandoo</option>
                  <option value="resdiary">ResDiary</option>
                  <option value="sevenrooms">SevenRooms</option>
                  <option value="bookeasy">Bookeasy</option>
                  <option value="tablecheck">TableCheck</option>
                  <option value="other">Other</option>
                </select>
                {bp.technologyStack?.bookingSystemType === 'other' && (
                  <Input
                    value={bp.technologyStack?.bookingSystemOther || ''}
                    onChange={(e) => updateBusinessPlan({
                      technologyStack: {
                        ...bp.technologyStack,
                        bookingSystemOther: e.target.value,
                      },
                    })}
                    placeholder="Enter booking system name..."
                    className="mt-2 text-sm"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderOperationalReadiness = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Operational Readiness</h2>
        <p className="text-sm text-muted-foreground">Have you selected your key suppliers?</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'hasEquipmentSupplier', nameKey: 'equipmentSupplierName', label: 'Equipment Supplier' },
          { key: 'hasFoodSupplier', nameKey: 'foodSupplierName', label: 'Food Supplier' },
          { key: 'hasBeverageSupplier', nameKey: 'beverageSupplierName', label: 'Beverage Supplier' },
          { key: 'hasPackagingSupplier', nameKey: 'packagingSupplierName', label: 'Packaging Supplier' },
        ].map(supplier => (
          <div key={supplier.key} className="flex items-start gap-4 p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="text-sm">{supplier.label}</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={supplier.key}
                    checked={bp.operationalReadiness?.[supplier.key as keyof typeof bp.operationalReadiness] === true}
                    onChange={() => updateBusinessPlan({
                      operationalReadiness: {
                        ...bp.operationalReadiness,
                        [supplier.key]: true,
                      },
                    })}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={supplier.key}
                    checked={bp.operationalReadiness?.[supplier.key as keyof typeof bp.operationalReadiness] === false}
                    onChange={() => updateBusinessPlan({
                      operationalReadiness: {
                        ...bp.operationalReadiness,
                        [supplier.key]: false,
                      },
                    })}
                  />
                  Not yet
                </label>
              </div>
              {bp.operationalReadiness?.[supplier.key as keyof typeof bp.operationalReadiness] === true && (
                <Input
                  value={bp.operationalReadiness?.[supplier.nameKey as keyof typeof bp.operationalReadiness] as string || ''}
                  onChange={(e) => updateBusinessPlan({
                    operationalReadiness: {
                      ...bp.operationalReadiness,
                      [supplier.nameKey]: e.target.value,
                    },
                  })}
                  placeholder={`${supplier.label} name (optional)`}
                  className="mt-2 text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOwnership = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Business Structure & Ownership</h2>
        <p className="text-sm text-muted-foreground">Details about how your business is structured.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">Business Structure</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={bp.ownership?.businessStructure || ''}
            onChange={(e) => updateBusinessPlan({
              ownership: {
                ...bp.ownership,
                businessStructure: e.target.value as BusinessStructure,
              },
            })}
          >
            <option value="">Select structure...</option>
            <option value="soleTrader">Sole Trader</option>
            <option value="partnership">Partnership</option>
            <option value="company">Pty Ltd Company</option>
            <option value="trust">Trust</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <Label className="text-sm">Owners</Label>
          <Input
            value={bp.ownership?.owners || ''}
            onChange={(e) => updateBusinessPlan({
              ownership: {
                ...bp.ownership,
                owners: e.target.value,
              },
            })}
            placeholder="e.g., John Smith, Jane Smith"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">Directors (if company)</Label>
          <Input
            value={bp.ownership?.directors || ''}
            onChange={(e) => updateBusinessPlan({
              ownership: {
                ...bp.ownership,
                directors: e.target.value,
              },
            })}
            placeholder="e.g., John Smith"
            className="mt-1"
          />
        </div>

        <div className="flex items-start gap-4 p-3 border rounded-lg">
          <div className="flex-1">
            <Label className="text-sm">Any silent investors?</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="hasSilentInvestors"
                  checked={bp.ownership?.hasSilentInvestors === true}
                  onChange={() => updateBusinessPlan({
                    ownership: {
                      ...bp.ownership,
                      hasSilentInvestors: true,
                    },
                  })}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="hasSilentInvestors"
                  checked={bp.ownership?.hasSilentInvestors === false}
                  onChange={() => updateBusinessPlan({
                    ownership: {
                      ...bp.ownership,
                      hasSilentInvestors: false,
                    },
                  })}
                />
                No
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Review & Generate</h2>
        <p className="text-sm text-muted-foreground">Review your readiness and generate your business plan.</p>
      </div>

      {project.scenarioMode === 'multi' && (
        <div className="mb-6">
          <Label className="text-sm mb-2 block">Select Scenario for Plan</Label>
          <div className="flex gap-2">
            {(['scenario1', 'scenario2', 'scenario3'] as const).map(s => (
              <Button
                key={s}
                size="sm"
                onClick={() => setActiveScenario(s)}
                className={activeScenario === s ? 'bg-brand hover:bg-brand/90 text-brand-foreground' : ''}
                variant={activeScenario === s ? 'default' : 'outline'}
              >
                {getScenarioLabel(s)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Card className={readiness.canGeneratePlan ? 'border-success/30 bg-success/10' : 'border-warning/30 bg-warning/10'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {readiness.canGeneratePlan ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-success">Ready to Generate</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-warning">Action Required</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readiness.blockers.length > 0 && (
            <div className="space-y-2 mb-4">
              {readiness.blockers.map((blocker, idx) => (
                <p key={idx} className="text-sm text-foreground">{blocker}</p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Readiness Checklist:</p>
            {[...readiness.requiredItems, ...readiness.optionalItems].map(item => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                {item.isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/60" />
                )}
                <span className={item.isComplete ? 'text-foreground' : 'text-muted-foreground/60'}>
                  {item.label}
                </span>
                {item.isRequired && !item.isComplete && (
                  <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Required</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {readiness.canGeneratePlan && (
        <Button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {bp.planType === 'detailed' ? 'Detailed' : 'Simple'} Business Plan
            </>
          )}
        </Button>
      )}
    </div>
  );

  const renderGeneratedPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {bp.planType === 'detailed' ? 'Detailed' : 'Simple'} Business Plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date(bp.generatedAt || '').toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {project.scenarioMode === 'multi' && ` | ${getScenarioLabel(activeScenario)}`}
          </p>
        </div>
      </div>

      {project.scenarioMode === 'multi' && (
        <Card className="border-border">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Active Scenario</Label>
              <div className="flex gap-2">
                {(['scenario1', 'scenario2', 'scenario3'] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    className={activeScenario === s ? 'bg-brand hover:bg-brand/90 text-brand-foreground' : ''}
                    variant={activeScenario === s ? 'default' : 'outline'}
                    onClick={async () => {
                      setActiveScenario(s);
                      if (bp.planType === 'detailed') {
                        const planData = await generateDetailedPlan(project, s, projectId);
                        updateBusinessPlan({
                          generatedPlanHtml: planData.html,
                          activeScenario: s,
                          hoursVisualizationData: planData.hoursVisualizationData,
                          hasServiceShifts: planData.hasServiceShifts,
                        } as any);
                      } else {
                        const planHtml = generateSimplePlan(project, s);
                        updateBusinessPlan({ generatedPlanHtml: planHtml, activeScenario: s });
                      }
                    }}
                  >
                    {getScenarioLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-1" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportWord}>
          <FileUp className="h-4 w-4 mr-1" />
          Download Word
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateBusinessPlan({
              generatedPlanHtml: null,
              generatedAt: null,
              intakeComplete: false,
            });
            setCurrentStep('review');
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Regenerate
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Mail className="h-4 w-4 mr-1" />
          Email Plan
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {bp.planType === 'simple' && (
          <Button
            onClick={handleProceedToDetailed}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Proceed to Detailed Business Plan
          </Button>
        )}
        <Button variant="outline" onClick={handleUpdateSimple}>
          <Edit3 className="h-4 w-4 mr-1" />
          Update {bp.planType === 'simple' ? 'Simple' : 'Detailed'} Plan
        </Button>
      </div>

      {bp.opportunities && bp.opportunities.length > 0 && (
        <Card className="border-warning/30 bg-warning/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Mojo Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bp.opportunities.map((opp, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-foreground">{opp.description}</p>
                  {opp.referralCallout && (
                    <p className="text-warning text-xs mt-1">{opp.referralCallout}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {projectId && (
        <ContentUploadsPanel
          projectId={projectId}
          canEdit={canEdit}
        />
      )}

      <Card>
        <CardContent className="p-6">
          <BusinessPlanContent
            html={bp.generatedPlanHtml || ''}
            hoursVisualizationData={(bp as any).hoursVisualizationData}
            hasServiceShifts={(bp as any).hasServiceShifts || false}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    if (bp.generatedPlanHtml && bp.intakeComplete) {
      return renderGeneratedPlan();
    }

    switch (currentStep) {
      case 'planTypeSelection': return renderPlanTypeSelection();
      case 'coreDetails': return renderCoreDetails();
      case 'fundingFinance': return renderFundingFinance();
      case 'operatorExperience': return renderOperatorExperience();
      case 'professionalServices': return renderProfessionalServices();
      case 'technologyStack': return renderTechnologyStack();
      case 'operationalReadiness': return renderOperationalReadiness();
      case 'ownership': return renderOwnership();
      case 'review': return renderReview();
      default: return renderCoreDetails();
    }
  };

  const showNavigation = currentStep !== 'planTypeSelection' && !(bp.generatedPlanHtml && bp.intakeComplete);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">AI Business Plan</h1>
        <p className="text-sm text-muted-foreground">
          Generate a professional business plan using your Mojo data.
        </p>
      </div>

      {showNavigation && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {intakeSteps.length}
            </span>
            <Badge variant="outline" className="text-xs">
              {bp.planType === 'detailed' ? 'Detailed Plan' : 'Simple Plan'}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {renderCurrentStep()}

      {showNavigation && (
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep !== 'review' && (
            <Button onClick={goToNextStep}>
              {currentStep === intakeSteps[intakeSteps.length - 2] ? 'Review' : 'Continue'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
