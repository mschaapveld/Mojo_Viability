import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Pencil, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Circle as XCircle, Info, Link2, Link2Off } from 'lucide-react';
import { ProjectData, StaffRole } from '@/lib/types/projectTypes';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';

interface LabourCostingProps {
  project: ProjectData;
  onUpdate: (updates: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
}

const COMMON_ROLES = [
  'Assistant Manager',
  'Bar Tender',
  'Chef',
  'Delivery Driver',
  'Front of House Manager',
  'Head Chef',
  'Junior Front of House',
  'Junior Kitchen Team Member',
  'Kitchen Hand',
  'Kitchen Manager',
  'Manager',
  'Sales Assistant',
  'Shift Supervisor',
  'Store Manager',
  'Team Member',
  'Venue Manager',
  'Wait Staff',
  'Other',
];

type StaffCategory = 'Management' | 'Kitchen' | 'Front of House' | 'Other';

const CATEGORY_ORDER: StaffCategory[] = ['Management', 'Kitchen', 'Front of House', 'Other'];

const ROLE_CATEGORIES: Record<string, StaffCategory> = {
  'Manager': 'Management',
  'Assistant Manager': 'Management',
  'Store Manager': 'Management',
  'Venue Manager': 'Management',
  'Front of House Manager': 'Management',
  'Kitchen Manager': 'Management',
  'Shift Supervisor': 'Management',
  'Chef': 'Kitchen',
  'Head Chef': 'Kitchen',
  'Kitchen Hand': 'Kitchen',
  'Kitchen Team Member': 'Kitchen',
  'Junior Kitchen Team Member': 'Kitchen',
  'Bar Tender': 'Front of House',
  'Wait Staff': 'Front of House',
  'Junior Front of House': 'Front of House',
  'Team Member': 'Front of House',
  'Sales Assistant': 'Front of House',
  'Delivery Driver': 'Front of House',
  'Other': 'Other',
};

const ROLE_DEFAULTS: Record<string, { employmentStatus: 'Casual' | 'Part Time' | 'Full Time'; payType?: 'Hourly' | 'Salaried'; hourlyRate: number }> = {
  'Bar Tender': { employmentStatus: 'Casual', hourlyRate: 24.20 },
  'Junior Kitchen Team Member': { employmentStatus: 'Casual', hourlyRate: 22.80 },
  'Junior Front of House': { employmentStatus: 'Casual', hourlyRate: 23.50 },
  'Delivery Driver': { employmentStatus: 'Casual', hourlyRate: 23.80 },
  'Chef': { employmentStatus: 'Part Time', hourlyRate: 28.90 },
  'Kitchen Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 35.00 },
  'Head Chef': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 38.50 },
  'Front of House Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 36.00 },
  'Venue Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 39.20 },
  'Team Member': { employmentStatus: 'Casual', hourlyRate: 23.50 },
  'Shift Supervisor': { employmentStatus: 'Part Time', hourlyRate: 26.80 },
  'Assistant Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 31.20 },
  'Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 38.50 },
  'Wait Staff': { employmentStatus: 'Casual', hourlyRate: 24.20 },
  'Kitchen Hand': { employmentStatus: 'Casual', hourlyRate: 22.80 },
  'Sales Assistant': { employmentStatus: 'Casual', hourlyRate: 23.80 },
  'Store Manager': { employmentStatus: 'Full Time', payType: 'Salaried', hourlyRate: 36.50 },
  'Other': { employmentStatus: 'Casual', hourlyRate: 23.50 },
};

const SUPERANNUATION_RATE = 0.11;

const CATEGORY_LABELS: Record<StaffCategory, string> = {
  'Management': 'MANAGEMENT',
  'Kitchen': 'KITCHEN',
  'Front of House': 'FRONT OF HOUSE',
  'Other': 'OTHER',
};

export function LabourCosting({ project, onUpdate, onNavigate }: LabourCostingProps) {
  const [staffMembers, setStaffMembers] = useState<StaffRole[]>(
    project.labourCosting?.staffRoles || []
  );
  const [localExpandedId, setLocalExpandedId] = useState<string | null>(null);

  const breakEvenWeeklySales = project.detailedBreakEven?.scenario1?.enteredSales || 0;
  const hasBreakEvenSales = breakEvenWeeklySales > 0;

  const [useManualSales, setUseManualSales] = useState(
    project.labourCosting?.useManualSales ?? !hasBreakEvenSales
  );
  const [manualWeeklySales, setManualWeeklySales] = useState(
    project.labourCosting?.weeklySales || project.salesBreakup?.weeklySales || 0
  );

  const weeklySales = useManualSales ? manualWeeklySales : breakEvenWeeklySales;

  useEffect(() => {
    if (staffMembers.length === 0) {
      addDefaultStaffMember();
    }
  }, []);

  const formatNumber = (value: number): string => {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDecimal = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const parseFormattedNumber = (value: string): number => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return parseFloat(numericValue) || 0;
  };

  useEffect(() => {
    if (staffMembers.length > 0) {
      onUpdate({
        labourCosting: {
          selectedAward: 'restaurant',
          staffRoles: staffMembers,
          weeklySales: useManualSales ? manualWeeklySales : breakEvenWeeklySales,
          useManualSales,
        },
      });
    }
  }, [staffMembers, manualWeeklySales, useManualSales, breakEvenWeeklySales]);

  const addDefaultStaffMember = () => {
    const firstRole = COMMON_ROLES[0];
    const defaults = ROLE_DEFAULTS[firstRole];
    const newId = crypto.randomUUID();

    setStaffMembers([{
      id: newId,
      roleName: firstRole,
      category: ROLE_CATEGORIES[firstRole] || 'Other',
      hoursPerWeek: defaults.employmentStatus === 'Full Time' ? 38 : 20,
      hourlyRate: defaults.hourlyRate,
      loading: defaults.employmentStatus === 'Casual' ? 1.25 : 1.0,
      employmentStatus: defaults.employmentStatus,
      payType: defaults.payType,
      includeSuperannuation: true,
    }]);
    setLocalExpandedId(newId);
  };

  const addStaffMember = () => {
    const firstRole = COMMON_ROLES[0];
    const defaults = ROLE_DEFAULTS[firstRole];
    const newId = crypto.randomUUID();

    setStaffMembers(prev => [
      ...prev,
      {
        id: newId,
        roleName: firstRole,
        category: ROLE_CATEGORIES[firstRole] || 'Other',
        hoursPerWeek: defaults.employmentStatus === 'Full Time' ? 38 : 20,
        hourlyRate: defaults.hourlyRate,
        loading: defaults.employmentStatus === 'Casual' ? 1.25 : 1.0,
        employmentStatus: defaults.employmentStatus,
        payType: defaults.payType,
        includeSuperannuation: true,
      },
    ]);
    setLocalExpandedId(newId);
  };

  const updateStaffMember = (id: string, field: keyof StaffRole, value: any) => {
    setStaffMembers(staffMembers.map(member => {
      if (member.id === id) {
        if (field === 'roleName') {
          const defaults = ROLE_DEFAULTS[value] || ROLE_DEFAULTS['Other'];
          const autoCategory = ROLE_CATEGORIES[value] || 'Other';

          if (!member.employmentStatus) {
            return {
              ...member,
              roleName: value,
              category: autoCategory,
              hourlyRate: defaults.hourlyRate,
              employmentStatus: defaults.employmentStatus,
              payType: defaults.payType,
              hoursPerWeek: defaults.employmentStatus === 'Full Time' ? 38 : member.hoursPerWeek,
              loading: defaults.employmentStatus === 'Casual' ? 1.25 : 1.0,
            };
          }

          return {
            ...member,
            roleName: value,
            category: autoCategory,
          };
        }

        if (field === 'employmentStatus') {
          const updates: Partial<StaffRole> = {
            employmentStatus: value,
          };

          if (value === 'Full Time') {
            updates.hoursPerWeek = 38;
            updates.loading = 1.0;
            if (!member.payType) {
              updates.payType = 'Hourly';
            }
          } else if (value === 'Casual') {
            updates.loading = 1.25;
            updates.payType = undefined;
            updates.salary = undefined;
          } else if (value === 'Part Time') {
            updates.loading = 1.0;
            updates.payType = undefined;
            updates.salary = undefined;
          }

          return { ...member, ...updates };
        }

        if (field === 'payType' && value === 'Salaried') {
          return {
            ...member,
            payType: value,
            salary: member.salary || 75000,
          };
        }

        if (field === 'payType' && value === 'Hourly') {
          return {
            ...member,
            payType: value,
            salary: undefined,
          };
        }

        return { ...member, [field]: value };
      }
      return member;
    }));
  };

  const removeStaffMember = (id: string) => {
    setStaffMembers(staffMembers.filter(member => member.id !== id));
    if (localExpandedId === id) setLocalExpandedId(null);
  };

  const handleSaveMember = (id: string) => {
    const member = staffMembers.find(m => m.id === id);
    if (!member || !member.employmentStatus) return;
    setLocalExpandedId(null);
  };

  const calculateWeeklyCostForMember = (member: StaffRole): number => {
    let baseCost = 0;

    if (member.employmentStatus === 'Full Time' && member.payType === 'Salaried' && member.salary) {
      baseCost = member.salary / 52;
    } else {
      baseCost = member.hoursPerWeek * member.hourlyRate * (member.loading || 1.0);
    }

    if (member.includeSuperannuation) {
      baseCost = baseCost * (1 + SUPERANNUATION_RATE);
    }

    return baseCost;
  };

  const calculateWeeklyLabourCost = () => {
    return staffMembers.reduce((total, member) => {
      return total + calculateWeeklyCostForMember(member);
    }, 0);
  };

  const calculateLabourPercentage = () => {
    if (weeklySales === 0) return 0;
    return (calculateWeeklyLabourCost() / weeklySales) * 100;
  };

  const getViabilityStatus = () => {
    const percentage = calculateLabourPercentage();
    if (percentage > 50) return 'fail';
    if (percentage > 35) return 'warning';
    return 'good';
  };

  const weeklyLabourCost = calculateWeeklyLabourCost();
  const labourPercentage = calculateLabourPercentage();
  const viabilityStatus = getViabilityStatus();

  const getDisplayName = (member: StaffRole) => member.customName?.trim() || member.roleName;

  const getCompactDetails = (member: StaffRole): string => {
    if (!member.employmentStatus) return '';
    if (member.employmentStatus === 'Full Time' && member.payType === 'Salaried' && member.salary) {
      return `$${formatNumber(member.salary)} / yr`;
    }
    return `${member.hoursPerWeek} hrs/wk · $${formatDecimal(member.hourlyRate, 2)}/hr`;
  };

  const renderCollapsedTile = (member: StaffRole) => {
    const weeklyCost = calculateWeeklyCostForMember(member);
    const cat = member.category || ROLE_CATEGORIES[member.roleName] || 'Other';

    return (
      <div
        key={member.id}
        className="flex items-center justify-between border rounded-lg py-2 px-4 bg-background hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {getDisplayName(member)}
          </span>
          <span className="text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded shrink-0">
            {cat}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            {member.employmentStatus && (
              <span>{member.employmentStatus}</span>
            )}
            {member.employmentStatus && (
              <span className="text-muted-foreground/35">·</span>
            )}
            <span>{getCompactDetails(member)}</span>
          </div>
          {member.employmentStatus && (
            <span className="text-sm font-semibold text-muted-foreground">
              ${formatDecimal(weeklyCost, 0)}/wk
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-muted-foreground"
              onClick={() => setLocalExpandedId(member.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {staffMembers.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-destructive"
                onClick={() => removeStaffMember(member.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedForm = (member: StaffRole) => {
    const canSave = !!member.employmentStatus;

    return (
      <div key={member.id} className="border rounded-lg p-4 space-y-4 bg-surface-2">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">Name or label</Label>
          <Input
            type="text"
            placeholder="e.g. Mary, Venue Manager, Shift Lead"
            value={member.customName || ''}
            onChange={(e) => updateStaffMember(member.id, 'customName', e.target.value)}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground/60">
            Used to identify this person. Defaults to their role title if left blank.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Role/Title</Label>
            <Select
              value={member.roleName}
              onValueChange={(value) => updateStaffMember(member.id, 'roleName', value)}
            >
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_ROLES.map((roleName) => (
                  <SelectItem key={roleName} value={roleName}>
                    {roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Category</Label>
            <Select
              value={member.category || ROLE_CATEGORIES[member.roleName] || 'Other'}
              onValueChange={(value) => updateStaffMember(member.id, 'category', value as StaffCategory)}
            >
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Employment Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={member.employmentStatus || ''}
              onValueChange={(value) => updateStaffMember(member.id, 'employmentStatus', value)}
            >
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Part Time">Part Time</SelectItem>
                <SelectItem value="Full Time">Full Time</SelectItem>
              </SelectContent>
            </Select>
            {member.employmentStatus && ROLE_DEFAULTS[member.roleName]?.employmentStatus === member.employmentStatus && (
              <p className="text-xs text-info mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Suggested based on role
              </p>
            )}
          </div>

          {member.employmentStatus === 'Full Time' && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Pay Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={member.payType || ''}
                onValueChange={(value) => updateStaffMember(member.id, 'payType', value)}
              >
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Select pay type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Salaried">Salaried</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Hours per Week {member.employmentStatus !== 'Full Time' && <span className="text-destructive">*</span>}
            </Label>
            {member.employmentStatus === 'Full Time' ? (
              <div className="mt-1">
                <Input
                  type="text"
                  value="38"
                  disabled
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fixed at 38 hours for Full Time employees
                </p>
              </div>
            ) : (
              <Input
                type="text"
                value={formatNumber(member.hoursPerWeek)}
                onChange={(e) => updateStaffMember(member.id, 'hoursPerWeek', parseFormattedNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="mt-1 bg-background"
              />
            )}
          </div>

          {member.employmentStatus && member.employmentStatus !== 'Full Time' && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Hourly Rate ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={formatDecimal(member.hourlyRate, 2)}
                onChange={(e) => updateStaffMember(member.id, 'hourlyRate', parseFormattedNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="mt-1 bg-background"
              />
              {member.employmentStatus === 'Casual' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Should include casual loading (typically 25%)
                </p>
              )}
            </div>
          )}

          {member.employmentStatus === 'Full Time' && member.payType === 'Hourly' && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Hourly Rate ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={formatDecimal(member.hourlyRate, 2)}
                onChange={(e) => updateStaffMember(member.id, 'hourlyRate', parseFormattedNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="mt-1 bg-background"
              />
            </div>
          )}

          {member.employmentStatus === 'Full Time' && member.payType === 'Salaried' && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Annual Salary ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={formatNumber(member.salary || 0)}
                onChange={(e) => updateStaffMember(member.id, 'salary', parseFormattedNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="mt-1 bg-background"
              />
            </div>
          )}

          {member.employmentStatus && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id={`super-${member.id}`}
                checked={member.includeSuperannuation !== false}
                onChange={(e) => updateStaffMember(member.id, 'includeSuperannuation', e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor={`super-${member.id}`} className="text-sm text-muted-foreground cursor-pointer">
                Include Superannuation (11%)
              </Label>
            </div>
          )}
        </div>

        {member.employmentStatus && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Weekly Cost: <span className="font-semibold text-foreground">
                ${formatDecimal(calculateWeeklyCostForMember(member), 2)}
              </span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {staffMembers.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground/60 hover:text-destructive"
                onClick={() => removeStaffMember(member.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
          <Button
            size="sm"
            disabled={!canSave}
            onClick={() => handleSaveMember(member.id)}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            Save
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 5. Labour Costing</CardTitle>
          <CardDescription>
            Define your staffing requirements and calculate labour costs.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Weekly Sales</CardTitle>
          <CardDescription>
            Used to calculate labour as a percentage of sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasBreakEvenSales && (
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border">
              <div className="flex items-center gap-3">
                {useManualSales ? (
                  <Link2Off className="h-5 w-5 text-muted-foreground/60" />
                ) : (
                  <Link2 className="h-5 w-5 text-info" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {useManualSales ? 'Manual Entry' : 'Linked to Detailed Break-Even'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {useManualSales
                      ? 'Enter your own weekly sales figure'
                      : `Using Expected Sales from Break-Even: $${formatNumber(breakEvenWeeklySales)}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Override</span>
                <Switch
                  checked={useManualSales}
                  onCheckedChange={setUseManualSales}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label htmlFor="weekly-sales" className="text-sm font-medium text-muted-foreground">
              Weekly Sales ($)
            </Label>
            {useManualSales || !hasBreakEvenSales ? (
              <Input
                id="weekly-sales"
                type="text"
                value={formatNumber(manualWeeklySales)}
                onChange={(e) => setManualWeeklySales(parseFormattedNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="max-w-xs"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-info/10 border border-info/30 rounded-md text-info font-medium">
                  ${formatNumber(breakEvenWeeklySales)}
                </div>
                <span className="text-xs text-muted-foreground">(from Break-Even)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>
                Add staff members and define their employment details
              </CardDescription>
            </div>
            <Button onClick={addStaffMember} size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No staff members added yet.</p>
              <p className="text-sm mt-1">Click "Add Staff Member" to get started.</p>
            </div>
          )}

          {staffMembers.length > 0 && (() => {
            const grouped = CATEGORY_ORDER.reduce<Record<StaffCategory, StaffRole[]>>(
              (acc, cat) => ({ ...acc, [cat]: [] }),
              {} as Record<StaffCategory, StaffRole[]>
            );
            staffMembers.forEach(m => {
              const cat = m.category || ROLE_CATEGORIES[m.roleName] || 'Other';
              grouped[cat as StaffCategory].push(m);
            });

            return CATEGORY_ORDER.filter(cat => grouped[cat].length > 0).map(cat => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 pt-2">
                  {CATEGORY_LABELS[cat]}
                </p>
                {grouped[cat].map((member) => (
                  localExpandedId === member.id
                    ? renderExpandedForm(member)
                    : renderCollapsedTile(member)
                ))}
              </div>
            ));
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labour Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-2 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Weekly Labour Cost</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${formatDecimal(weeklyLabourCost, 2)}
              </p>
            </div>

            <div className="bg-surface-2 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Labour % of Sales</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatDecimal(labourPercentage, 1)}%
              </p>
            </div>

            <div className="bg-surface-2 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Viability Status</p>
              <div className="mt-1">
                {viabilityStatus === 'good' && (
                  <Badge className="bg-success/20 text-success">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Good
                  </Badge>
                )}
                {viabilityStatus === 'warning' && (
                  <Badge className="bg-warning/20 text-warning-foreground">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Warning
                  </Badge>
                )}
                {viabilityStatus === 'fail' && (
                  <Badge className="bg-destructive/20 text-destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Unviable
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {viabilityStatus === 'fail' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Labour costs are too high!</strong> Your labour represents more than 50% of sales.
                This is typically unviable. Consider reducing staffing hours, adjusting roles, or increasing
                expected sales before continuing.
              </AlertDescription>
            </Alert>
          )}

          {viabilityStatus === 'warning' && (
            <Alert className="border-warning/30 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <AlertDescription className="text-warning-foreground">
                <strong>Labour costs are elevated.</strong> Your labour represents more than 35% of sales.
                This may be manageable but requires careful monitoring. We recommend consulting with an
                accountant to optimise your staffing model.
              </AlertDescription>
            </Alert>
          )}

          {viabilityStatus === 'good' && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                <strong>Labour costs look healthy!</strong> Your labour percentage is within a sustainable
                range for most hospitality businesses.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.LABOUR_COSTING}
          onNavigate={onNavigate}
          onUpdate={onUpdate}
          showPrevious={true}
          disabled={staffMembers.length === 0 || weeklySales === 0 || staffMembers.some(m => !m.employmentStatus)}
        />
      )}
    </div>
  );
}
