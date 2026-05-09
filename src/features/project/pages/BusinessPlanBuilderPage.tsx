import { ScenarioMode, ProjectData, VenueType } from "@/lib/types/projectTypes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  project: ProjectData;
  onChange: (patch: Partial<ProjectData>) => void;
  onNavigateToDetailed?: () => void;
  isGoogleMapsLoaded?: boolean;
  onNavigate?: (route: string) => void;
  onSaveProject?: () => Promise<void>;
  projectId?: string | null;
}

const VENUE_TYPE_OPTIONS: { label: string; value: VenueType }[] = [
  { label: 'QSR / Burger / Fast Casual', value: 'Quick service restaurant (QSR)' },
  { label: 'Café / Brunch', value: 'Cafe' },
  { label: 'Restaurant (Table Service)', value: 'Medium restaurant' },
  { label: 'Bar / Pub / Taproom', value: 'Pub / Tavern' },
  { label: 'Coffee / Grab-and-Go', value: 'Small bar' },
];

export default function BusinessPlanBuilder({ project, onChange, projectId }: Props) {
  const scenarioMode = project.scenarioMode || 'single';

  const setScenarioMode = (m: ScenarioMode) => {
    onChange({ scenarioMode: m });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 1. Project Setup</CardTitle>
          <CardDescription>
            Name your project and choose how you want to run your analysis.
            {!projectId && (
              <span className="ml-2 text-xs text-warning-foreground font-medium">Not saved yet</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Project Identity</CardTitle>
            <CardDescription className="text-xs">Tell us a bit about the business you're evaluating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 pb-5">
            <div>
              <Label htmlFor="business-name" className="text-xs font-medium text-muted-foreground">Business name</Label>
              <Input
                id="business-name"
                type="text"
                value={project?.siteName || ''}
                placeholder="e.g. Burger Palace"
                onChange={(e) => {
                  const v = e.target.value || null;
                  onChange({ siteName: v, projectName: v || undefined });
                }}
                className="mt-1 bg-surface-1 h-9 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="locality" className="text-xs font-medium text-muted-foreground">Locality / suburb</Label>
              <Input
                id="locality"
                type="text"
                value={project?.storeTown || ''}
                placeholder="e.g. Port Macquarie"
                onChange={(e) => {
                  onChange({ storeTown: e.target.value || undefined });
                }}
                className="mt-1 bg-surface-1 h-9 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="venue-type" className="text-xs font-medium text-muted-foreground">Business type</Label>
              <Select
                value={project?.venueType || ''}
                onValueChange={(v) => onChange({ venueType: v as VenueType })}
              >
                <SelectTrigger id="venue-type" className="mt-1 h-9 text-sm bg-surface-1">
                  <SelectValue placeholder="Select a business type" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="text-base">Site Comparison</CardTitle>
            <CardDescription className="text-xs">
              Are you evaluating one specific site, or do you want to compare a few different locations side by side?
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-5">
            <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
              <button
                onClick={() => setScenarioMode('single')}
                className={`min-w-[110px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                  scenarioMode === 'single'
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Single Site
              </button>
              <button
                onClick={() => setScenarioMode('multi')}
                className={`min-w-[110px] px-4 py-1 rounded-full text-sm font-medium text-center transition-all duration-200 ${
                  scenarioMode === 'multi'
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Multiple Sites
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
