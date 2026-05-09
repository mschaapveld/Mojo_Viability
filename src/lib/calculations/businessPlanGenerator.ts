import {
  ProjectData,
  BusinessPlanOpportunity,
  DetailedBreakEvenScenario,
  FitoutFinancingScenario,
  StaffRole,
} from '@/lib/types/projectTypes';
import { generateForecast, ForecastResult } from './forecastEngine';
import { calculateProjectSummary } from './projectSummary';
import { extractSuburbAndState } from '../addressUtils';
import { supabase } from '../supabase';
import {
  transformWeeklyScheduleToVisualizationData,
  generateHoursVisualizationHtml,
  generateHoursNarrative,
  WeeklySchedule,
} from '../hoursVisualization';
import { formatCurrency } from '@/lib/format';
import { escapeHtml } from '@/lib/htmlEscape';
import { TimeFormat } from '../timeUtils';
import {
  generateUploadsHtml,
  generateFloorPlanHtml,
  generateStylePhotosHtml,
  generateMenuPhotosHtml,
  generateAppendixHtml,
} from '../contentUploads';

interface BreakEvenResults {
  operatingBreakEven: number;
  ownersReturnBreakEven: number;
  totalFixedCosts: number;
  totalVariablePercent: number;
  contributionMargin: number;
}


function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatPOSSystemName(posSystem: string, posSystemOther?: string | null): string {
  if (posSystem === 'other' && posSystemOther) {
    return posSystemOther;
  }

  const posSystemNames: Record<string, string> = {
    'abacus': 'Abacus',
    'bepoz': 'Bepoz',
    'clover': 'Clover',
    'idealpos': 'Idealpos',
    'imagatec': 'Imagatec iPos',
    'impos': 'Impos',
    'kounta': 'Kounta',
    'lightspeed': 'Lightspeed',
    'ordermate': 'OrderMate',
    'revel': 'Revel',
    'square': 'Square',
    'swiftpos': 'SwiftPos',
    'toast': 'Toast',
    'undecided': 'Not decided yet',
  };

  return posSystemNames[posSystem] || posSystem;
}

function calculateBreakEvenResults(
  scenario: DetailedBreakEvenScenario,
  _period: 'Weekly' | 'Monthly' | 'Yearly'
): BreakEvenResults {
  const customFixedTotal = (scenario.customFixedCosts || []).reduce((sum, c) => sum + c.value, 0);

  const totalFixedCosts =
    scenario.rent +
    scenario.labourMinimumCost +
    (scenario.insurance || 0) +
    (scenario.accounting || 0) +
    (scenario.marketing || 0) +
    (scenario.utilities || 0) +
    (scenario.otherFixed || 0) +
    customFixedTotal;

  const franchiseFees = scenario.isFranchise
    ? (scenario.franchiseRoyaltyPercent || 0) + (scenario.franchiseMarketingPercent || 0)
    : 0;

  const totalVariablePercent =
    scenario.variableCogs +
    scenario.variableLabour +
    scenario.variableOther +
    franchiseFees;

  const contributionMargin = 100 - totalVariablePercent;
  const contributionMarginDecimal = contributionMargin / 100;

  const operatingBreakEven = contributionMarginDecimal > 0
    ? totalFixedCosts / contributionMarginDecimal
    : 0;

  const ownersReturnBreakEven = contributionMarginDecimal > 0
    ? (totalFixedCosts + scenario.ownersReturn) / contributionMarginDecimal
    : 0;

  return {
    operatingBreakEven,
    ownersReturnBreakEven,
    totalFixedCosts,
    totalVariablePercent,
    contributionMargin,
  };
}

function getViabilityStatus(
  enteredSales: number,
  operatingBreakEven: number,
  ownersReturnBreakEven: number
): { status: string; color: string; description: string; recommendation: string } {
  if (enteredSales >= ownersReturnBreakEven) {
    return {
      status: 'Strong',
      color: 'green',
      description: 'Projected sales exceed the break-even point including owner\'s return.',
      recommendation: 'This business model appears viable. Consider proceeding to a Detailed Business Plan for finance applications.',
    };
  } else if (enteredSales >= operatingBreakEven) {
    return {
      status: 'Marginal',
      color: 'amber',
      description: 'Projected sales cover operating costs but fall short of owner\'s return.',
      recommendation: 'Review cost structure and sales targets before proceeding. A Detailed Plan may help identify optimisation opportunities.',
    };
  } else {
    return {
      status: 'At Risk',
      color: 'red',
      description: 'Projected sales do not cover operating costs.',
      recommendation: 'Significant changes to the business model are recommended before proceeding further.',
    };
  }
}

function calculateWeeklyTradingHours(project: ProjectData): number {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  let totalHours = 0;

  days.forEach(day => {
    const schedule = project.hoursOfOperation[day];
    if (schedule.open) {
      const parseTime = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h + (m || 0) / 60;
      };
      const breakfast = Math.max(0, parseTime(schedule.breakfast.end) - parseTime(schedule.breakfast.start));
      const lunch = Math.max(0, parseTime(schedule.lunch.end) - parseTime(schedule.lunch.start));
      const dinner = Math.max(0, parseTime(schedule.dinner.end) - parseTime(schedule.dinner.start));
      totalHours += breakfast + lunch + dinner;
    }
  });

  return totalHours;
}

function getOpenDaysCount(project: ProjectData): number {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  return days.filter(day => project.hoursOfOperation[day].open).length;
}

async function generateDetailedHoursVisualization(timeFormat: TimeFormat = '12h'): Promise<{
  html: string;
  narrative: string;
  visualizationData: any;
  hasServiceShifts: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        html: '<p class="text-sm text-muted-foreground/60">Hours not yet specified.</p>',
        narrative: '',
        visualizationData: null,
        hasServiceShifts: false
      };
    }

    const { data: hoursData, error } = await supabase
      .from('hours_of_operation')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !hoursData || !hoursData.weekly_data) {
      return {
        html: '<p class="text-sm text-muted-foreground/60">Hours not yet specified.</p>',
        narrative: '',
        visualizationData: null,
        hasServiceShifts: false
      };
    }

    const weeklyData = hoursData.weekly_data as WeeklySchedule;
    const visualizationData = transformWeeklyScheduleToVisualizationData(weeklyData);

    if (!visualizationData) {
      return {
        html: '<p class="text-sm text-muted-foreground/60">Hours not yet specified.</p>',
        narrative: '',
        visualizationData: null,
        hasServiceShifts: false
      };
    }

    const hasServiceShifts = Object.values(visualizationData.summary.serviceBreakdown).length > 0;
    const html = generateHoursVisualizationHtml(visualizationData, timeFormat);
    const narrative = generateHoursNarrative(visualizationData);

    return { html, narrative, visualizationData, hasServiceShifts };
  } catch (error) {
    console.error('Error generating hours visualization:', error);
    return {
      html: '<p class="text-sm text-muted-foreground/60">Hours not yet specified.</p>',
      narrative: '',
      visualizationData: null,
      hasServiceShifts: false
    };
  }
}

function getStaffingSummary(staffRoles: StaffRole[]): {
  totalStaff: number;
  roleBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  narrativeSentence: string;
} {
  const totalStaff = staffRoles.length;
  const roleBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = { 'Casual': 0, 'Part Time': 0, 'Full Time': 0 };

  staffRoles.forEach(role => {
    roleBreakdown[role.roleName] = (roleBreakdown[role.roleName] || 0) + 1;
    if (role.employmentStatus) {
      statusBreakdown[role.employmentStatus]++;
    }
  });

  const roleParts = Object.entries(roleBreakdown).map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`);
  const statusParts: string[] = [];
  if (statusBreakdown['Full Time'] > 0) statusParts.push(`${statusBreakdown['Full Time']} full-time`);
  if (statusBreakdown['Part Time'] > 0) statusParts.push(`${statusBreakdown['Part Time']} part-time`);
  if (statusBreakdown['Casual'] > 0) statusParts.push(`${statusBreakdown['Casual']} casual`);

  let narrativeSentence = `Initially, the business will operate with ${totalStaff} staff member${totalStaff !== 1 ? 's' : ''}`;
  if (roleParts.length > 0) {
    narrativeSentence += ` comprising ${roleParts.join(', ')}`;
  }
  if (statusParts.length > 0) {
    narrativeSentence += ` (${statusParts.join(', ')})`;
  }
  narrativeSentence += '.';

  return { totalStaff, roleBreakdown, statusBreakdown, narrativeSentence };
}

function calculateMenuItemCost(ingredients: { cost: number }[]): number {
  return ingredients.reduce((total, ing) => total + ing.cost, 0);
}

function calculateMenuItemMargin(price: number, cost: number): { profit: number; cogsPercent: number } {
  const profit = price - cost;
  const cogsPercent = price > 0 ? (cost / price) * 100 : 0;
  return { profit, cogsPercent };
}

function generateMenuHtml(project: ProjectData): string {
  const menuData = project.menuData;

  if (!menuData || !menuData.items || menuData.items.length === 0) {
    return `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning font-medium">Menu not yet created.</p>
      <p class="text-sm text-amber-600 mt-1">Add a menu in the Menu Builder to include it in this plan.</p>
    </div>
    `;
  }

  let html = '<div class="space-y-6">';

  menuData.majorCategories
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .forEach(majorCat => {
      const subCatsForMajor = menuData.subCategories.filter(sc => sc.majorCategoryId === majorCat.id);

      if (subCatsForMajor.length === 0) return;

      html += `
      <div class="mb-6">
        <h3 class="text-lg font-bold text-foreground mb-3">${majorCat.name}</h3>
      `;

      subCatsForMajor.forEach(subCat => {
        const itemsForSub = menuData.items
          .filter(item => item.subCategoryId === subCat.id)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (itemsForSub.length === 0) return;

        html += `
        <div class="mb-4 pl-3">
          <h4 class="text-md font-semibold text-muted-foreground mb-2">${subCat.name}</h4>
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b-2 border-slate-300">
                <th class="py-2 text-left text-muted-foreground font-semibold">Item</th>
                <th class="py-2 text-right text-muted-foreground font-semibold">Selling Price</th>
                <th class="py-2 text-right text-muted-foreground font-semibold">Cost Price</th>
                <th class="py-2 text-right text-muted-foreground font-semibold">Gross Margin</th>
                <th class="py-2 text-right text-muted-foreground font-semibold">COGS %</th>
              </tr>
            </thead>
            <tbody>
        `;

        itemsForSub.forEach(item => {
          const cost = calculateMenuItemCost(item.ingredients);
          const { profit, cogsPercent } = calculateMenuItemMargin(item.sellingPriceExGST, cost);

          html += `
              <tr class="border-b border-slate-200">
                <td class="py-2 font-medium">${item.name}</td>
                <td class="py-2 text-right">${formatCurrency(item.sellingPriceExGST)}</td>
                <td class="py-2 text-right">${formatCurrency(cost)}</td>
                <td class="py-2 text-right">${formatCurrency(profit)}</td>
                <td class="py-2 text-right">${cogsPercent.toFixed(1)}%</td>
              </tr>
          `;
        });

        html += `
            </tbody>
          </table>
        </div>
        `;
      });

      html += `</div>`;
    });

  html += '</div>';

  return html;
}

function buildCapitalLineItems(fitout: FitoutFinancingScenario): Array<{ label: string; amount: number }> {
  const items: Array<{ label: string; amount: number }> = [];

  if (fitout.fitout > 0) items.push({ label: 'Fitout/Renovation', amount: fitout.fitout });
  if (fitout.equipment > 0) items.push({ label: 'Equipment', amount: fitout.equipment });
  if (fitout.furniture > 0) items.push({ label: 'Furniture & Fixtures', amount: fitout.furniture });
  if (fitout.tech > 0) items.push({ label: 'Technology & POS', amount: fitout.tech });
  if (fitout.signage > 0) items.push({ label: 'Signage', amount: fitout.signage });
  if (fitout.stock > 0) items.push({ label: 'Initial Stock', amount: fitout.stock });
  if (fitout.operatingCapital > 0) items.push({ label: 'Working Capital Buffer', amount: fitout.operatingCapital });
  if (fitout.legal > 0) items.push({ label: 'Professional Fees (Legal/Accounting)', amount: fitout.legal });
  if ((fitout.designFees || 0) > 0) items.push({ label: 'Design Fees', amount: fitout.designFees || 0 });

  if (fitout.occupancyType === 'purchasing') {
    if ((fitout.propertyDeposit || 0) > 0) items.push({ label: 'Property Deposit', amount: fitout.propertyDeposit || 0 });
    if ((fitout.propertyStampDuty || 0) > 0) items.push({ label: 'Stamp Duty', amount: fitout.propertyStampDuty || 0 });
    if ((fitout.propertyClosingCosts || 0) > 0) items.push({ label: 'Closing Costs', amount: fitout.propertyClosingCosts || 0 });
  }

  (fitout.customSetupCosts || []).forEach(cost => {
    if (cost.amount > 0) items.push({ label: cost.name, amount: cost.amount });
  });

  return items;
}

export function identifyOpportunities(project: ProjectData): BusinessPlanOpportunity[] {
  const opportunities: BusinessPlanOpportunity[] = [];
  const techStack = project.businessPlan?.technologyStack;
  const profServices = project.businessPlan?.professionalServices;
  const opReadiness = project.businessPlan?.operationalReadiness;

  if (techStack?.orderingModel === 'inStoreOnly' || techStack?.orderingModel === 'aggregatorOnly') {
    opportunities.push({
      type: 'no_direct_ordering',
      description: 'No direct online ordering capability detected.',
      referralCallout: 'Consider Bite Business for online ordering and a branded app to reduce aggregator fees and build customer loyalty.',
      priority: 'high',
    });
  }

  if (techStack?.orderingModel === 'aggregatorOnly') {
    opportunities.push({
      type: 'aggregator_only',
      description: 'Currently relying only on third-party delivery platforms.',
      referralCallout: 'Direct ordering can save 15-30% on aggregator commissions.',
      priority: 'high',
    });
  }

  const venueType = project.detailedBreakEven.scenario1.venueType;
  const isRestaurantOrBar = venueType === 'Small restaurant' ||
    venueType === 'Small restaurant with bar' ||
    venueType === 'Medium restaurant' ||
    venueType === 'Large restaurant' ||
    venueType === 'Small bar' ||
    venueType === 'Pub / Tavern';

  if (techStack?.takesBookings === false && isRestaurantOrBar) {
    opportunities.push({
      type: 'no_booking_system',
      description: 'No booking system detected for a venue type that typically benefits from reservations.',
      priority: 'medium',
    });
  }

  if (techStack?.takesBookings === true && techStack?.bookingSystemType === 'manual' && isRestaurantOrBar) {
    opportunities.push({
      type: 'manual_booking_system',
      description: 'Currently using a manual reservation diary.',
      referralCallout: 'Consider a digital booking system to streamline reservations, reduce no-shows, and improve customer experience.',
      priority: 'medium',
    });
  }

  if (profServices?.hasAccountant === false) {
    opportunities.push({
      type: 'needs_accountant',
      description: 'No accountant engaged yet.',
      referralCallout: 'An experienced hospitality accountant can help optimise your tax position and business structure.',
      priority: 'high',
    });
  }

  if (profServices?.hasLawyer === false) {
    opportunities.push({
      type: 'needs_lawyer',
      description: 'No lawyer/solicitor engaged yet.',
      referralCallout: 'Legal review of lease agreements and business structures is strongly recommended before signing.',
      priority: 'high',
    });
  }

  if (profServices?.hasFinanceBroker === false && project.fitoutFinancing?.scenario1?.loanAmount > 0) {
    opportunities.push({
      type: 'needs_finance_broker',
      description: 'Planning to use finance but no broker engaged.',
      referralCallout: 'A finance broker can help secure better rates and terms for hospitality businesses.',
      priority: 'medium',
    });
  }

  if (techStack?.posSystem === 'undecided') {
    opportunities.push({
      type: 'needs_pos_system',
      description: 'POS system not yet selected.',
      referralCallout: 'Choosing the right POS early helps with planning, integrations, and staff training.',
      priority: 'medium',
    });
  }

  if (techStack?.accountingSystem === 'undecided') {
    opportunities.push({
      type: 'needs_accounting_system',
      description: 'Accounting system not yet selected.',
      priority: 'low',
    });
  }

  if (opReadiness?.hasEquipmentSupplier === false) {
    opportunities.push({
      type: 'needs_equipment_supplier',
      description: 'Equipment supplier not yet selected.',
      priority: 'medium',
    });
  }

  return opportunities;
}

export function generateSimplePlan(
  project: ProjectData,
  activeScenario: 'scenario1' | 'scenario2' | 'scenario3'
): string {
  const scenario = project.detailedBreakEven[activeScenario];
  const fitout = project.fitoutFinancing[activeScenario];
  const breakEven = calculateBreakEvenResults(scenario, project.period);
  const viability = getViabilityStatus(scenario.enteredSales, breakEven.operatingBreakEven, breakEven.ownersReturnBreakEven);

  const businessName = project.businessPlan?.brandName || project.siteName || 'Your Business';
  const address = project.siteAddress || project.location?.address || 'Address not specified';
  const businessType = project.businessPlan?.businessCategory || project.venueType || 'Hospitality Business';
  const locationDisplay = extractSuburbAndState(address);
  const venueType = scenario.venueType || null;

  const annualRent = scenario.rent * (project.period === 'Weekly' ? 52 : project.period === 'Monthly' ? 12 : 1);
  const premisesSize = project.location?.propertySize || project.propertyListingParsedData?.premisesSize;

  const weeklyHours = calculateWeeklyTradingHours(project);
  const openDays = getOpenDaysCount(project);
  const hasHoursData = weeklyHours > 0;

  const hasSalesBreakdown = project.salesBreakup && (
    project.salesBreakup.orderTypePercentages ||
    Object.values(project.salesBreakup.dayPercentages).some(v => v > 0)
  );

  const hasStaffingData = project.labourCosting && project.labourCosting.staffRoles.length > 0;
  const staffingSummary = hasStaffingData ? getStaffingSummary(project.labourCosting!.staffRoles) : null;

  const capitalLineItems = buildCapitalLineItems(fitout);
  const totalCapital = capitalLineItems.reduce((sum, item) => sum + item.amount, 0);

  const summary = calculateProjectSummary(project);
  let forecast: ForecastResult | null = null;
  try {
    forecast = generateForecast(project, summary);
  } catch {
    forecast = null;
  }

  const scenarioLabel = activeScenario === 'scenario1' ? 'Scenario 1' : activeScenario === 'scenario2' ? 'Scenario 2' : 'Scenario 3';

  let html = `
<div class="business-plan simple-plan">
  <h1 class="text-2xl font-bold text-foreground mb-2">Simple Business Plan</h1>
  <p class="text-sm text-muted-foreground/60 mb-1">${escapeHtml(businessName)}</p>
  <p class="text-xs text-muted-foreground/40 mb-6">Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}${project.scenarioMode === 'multi' ? ` | ${scenarioLabel}` : ''}</p>

  <!-- Executive Summary -->
  <section class="mb-8 bg-surface-2 rounded-lg p-5">
    <h2 class="text-lg font-semibold text-foreground mb-3">Executive Summary</h2>
    <div class="space-y-3 text-sm text-muted-foreground">
      <p><strong>Concept:</strong> ${escapeHtml(businessType)} at ${escapeHtml(address)}</p>
      <p class="text-base"><strong>Required Sales to Break-Even:</strong> <span class="text-lg font-bold text-info">${formatCurrency(breakEven.ownersReturnBreakEven)}</span> <span class="text-muted-foreground/60">${project.period.toLowerCase()}</span></p>
      <p><strong>Viability Status:</strong> <span class="font-semibold ${viability.color === 'green' ? 'text-success' : viability.color === 'amber' ? 'text-warning' : 'text-destructive'}">${viability.status}</span> - ${viability.description}</p>
      <p><strong>Capital Required:</strong> ${formatCurrency(totalCapital)} (see breakdown below)</p>
      <p class="text-muted-foreground italic mt-2">${viability.recommendation}</p>
    </div>
  </section>

  <!-- Concept Overview -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Concept Overview</h2>
    <table class="w-full text-sm">
      <tbody>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60 w-1/3">Business Name</td><td class="py-2 font-medium">${escapeHtml(businessName)}</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Business Type</td><td class="py-2 font-medium">${escapeHtml(businessType)}</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Location</td><td class="py-2 font-medium">${escapeHtml(locationDisplay)}</td></tr>
        ${venueType ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Venue Type</td><td class="py-2 font-medium">${escapeHtml(venueType)}</td></tr>` : ''}
        ${project.businessPlan?.targetMarket ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Target Market</td><td class="py-2 font-medium">${escapeHtml(project.businessPlan.targetMarket)}</td></tr>` : ''}
        ${project.businessPlan?.willServeAlcohol !== undefined ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Alcohol Licensed</td><td class="py-2 font-medium">${project.businessPlan.willServeAlcohol ? 'Yes' : 'No'}</td></tr>` : ''}
        ${project.businessPlan?.willHaveGamingOrBetting !== undefined ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Gaming/Betting</td><td class="py-2 font-medium">${project.businessPlan.willHaveGamingOrBetting ? 'Yes' : 'No'}</td></tr>` : ''}
      </tbody>
    </table>
  </section>

  <!-- Site Summary -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Site Summary</h2>
    <table class="w-full text-sm">
      <tbody>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60 w-1/3">Address</td><td class="py-2 font-medium">${escapeHtml(address)}</td></tr>
        ${premisesSize ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Floor Area</td><td class="py-2 font-medium">${premisesSize} sqm</td></tr>` : ''}
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Annual Rent</td><td class="py-2 font-medium">${formatCurrency(annualRent)} p.a.</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Occupancy Type</td><td class="py-2 font-medium">${scenario.occupancyType === 'purchasing' ? 'Purchasing' : 'Renting'}</td></tr>
      </tbody>
    </table>
  </section>

  <!-- Hours of Operation -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Hours of Operation</h2>
    ${hasHoursData ? `
    <div class="mb-4">
      <div class="grid grid-cols-7 gap-1 mb-3">
        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
          const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx];
          const schedule = project.hoursOfOperation[dayKey as keyof typeof project.hoursOfOperation];
          return `<div class="text-center">
            <div class="text-xs text-muted-foreground/60 mb-1">${day}</div>
            <div class="h-16 rounded ${schedule.open ? 'bg-info/100' : 'bg-muted'} flex items-center justify-center">
              <span class="text-xs ${schedule.open ? 'text-white' : 'text-muted-foreground/40'}">${schedule.open ? 'Open' : 'Closed'}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      <p class="text-sm text-muted-foreground">The business operates <strong>${openDays} day${openDays !== 1 ? 's' : ''} per week</strong> with approximately <strong>${weeklyHours.toFixed(1)} trading hours</strong> weekly.</p>
    </div>
    ` : `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning">Hours not provided. <button class="text-warning underline font-medium" data-action="update-hours">Update Hours</button></p>
    </div>
    `}
  </section>

  <!-- Sales Breakdown -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Sales Breakdown</h2>
    ${hasSalesBreakdown ? `
    <div class="space-y-4">
      ${project.salesBreakup.orderTypePercentages ? `
      <div>
        <h3 class="text-sm font-medium text-muted-foreground mb-2">By Order Type</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-surface-2 rounded p-3 text-center">
            <p class="text-lg font-bold text-foreground">${formatPercent(project.salesBreakup.orderTypePercentages.dineIn)}</p>
            <p class="text-xs text-muted-foreground/60">Dine-in</p>
          </div>
          <div class="bg-surface-2 rounded p-3 text-center">
            <p class="text-lg font-bold text-foreground">${formatPercent(project.salesBreakup.orderTypePercentages.takeaway)}</p>
            <p class="text-xs text-muted-foreground/60">Takeaway</p>
          </div>
          ${project.salesBreakup.orderTypePercentages.delivery ? `
          <div class="bg-surface-2 rounded p-3 text-center">
            <p class="text-lg font-bold text-foreground">${formatPercent(project.salesBreakup.orderTypePercentages.delivery)}</p>
            <p class="text-xs text-muted-foreground/60">Delivery</p>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      <div>
        <h3 class="text-sm font-medium text-muted-foreground mb-2">By Day of Week</h3>
        <div class="flex gap-1">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx];
            const pct = project.salesBreakup.dayPercentages[dayKey as keyof typeof project.salesBreakup.dayPercentages];
            const height = Math.max(20, pct * 3);
            return `<div class="flex-1 flex flex-col items-center">
              <div class="w-full bg-info/100 rounded-t" style="height: ${height}px"></div>
              <p class="text-xs text-muted-foreground/60 mt-1">${day}</p>
              <p class="text-xs font-medium">${pct.toFixed(0)}%</p>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${Object.keys(project.salesBreakup.servicePercentages).length > 0 ? `
      <div>
        <h3 class="text-sm font-medium text-muted-foreground mb-2">By Service Period</h3>
        <div class="grid grid-cols-3 gap-3">
          ${Object.entries(project.salesBreakup.servicePercentages).map(([service, pct]) => `
          <div class="bg-surface-2 rounded p-3 text-center">
            <p class="text-lg font-bold text-foreground">${formatPercent(pct)}</p>
            <p class="text-xs text-muted-foreground/60 capitalize">${service}</p>
          </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    ` : `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning">Sales breakdown not provided. <button class="text-warning underline font-medium" data-action="update-sales">Update Sales Breakdown</button></p>
    </div>
    `}
  </section>

  <!-- Staffing Plan -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Staffing Plan</h2>
    ${hasStaffingData && staffingSummary ? `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">${staffingSummary.narrativeSentence}</p>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="text-sm font-medium text-muted-foreground mb-2">Roles</h3>
          <table class="w-full text-sm">
            <tbody>
              ${Object.entries(staffingSummary.roleBreakdown).map(([role, count]) => `
              <tr class="border-b"><td class="py-1.5">${role}</td><td class="py-1.5 text-right font-medium">${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div>
          <h3 class="text-sm font-medium text-muted-foreground mb-2">Employment Type</h3>
          <table class="w-full text-sm">
            <tbody>
              ${Object.entries(staffingSummary.statusBreakdown).filter(([_, count]) => count > 0).map(([status, count]) => `
              <tr class="border-b"><td class="py-1.5">${status}</td><td class="py-1.5 text-right font-medium">${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ` : `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning">Staffing not provided. <button class="text-warning underline font-medium" data-action="update-labour">Update Labour Plan</button></p>
    </div>
    `}
  </section>

  <!-- Capital Requirements -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Capital Requirements</h2>
    ${capitalLineItems.length > 0 ? `
    <table class="w-full text-sm mb-4">
      <tbody>
        ${capitalLineItems.map(item => `
        <tr class="border-b"><td class="py-2 text-muted-foreground">${item.label}</td><td class="py-2 text-right font-medium">${formatCurrency(item.amount)}</td></tr>
        `).join('')}
        <tr class="bg-muted"><td class="py-2 font-bold">Total Startup Capital</td><td class="py-2 text-right font-bold text-lg">${formatCurrency(totalCapital)}</td></tr>
      </tbody>
    </table>
    ${fitout.loanAmount > 0 ? `
    <div class="bg-info/10 rounded-lg p-4">
      <h3 class="text-sm font-medium text-muted-foreground mb-2">Funding Structure</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><span class="text-muted-foreground/60">Loan Amount:</span> <span class="font-medium">${formatCurrency(fitout.loanAmount)}</span></div>
        <div><span class="text-muted-foreground/60">Owner's Capital:</span> <span class="font-medium">${formatCurrency(totalCapital - fitout.loanAmount)}</span></div>
        <div><span class="text-muted-foreground/60">Interest Rate:</span> <span class="font-medium">${fitout.loanInterest}%</span></div>
        <div><span class="text-muted-foreground/60">Loan Term:</span> <span class="font-medium">${fitout.loanTerm} years</span></div>
      </div>
    </div>
    ` : ''}
    ` : `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning">Capital requirements not provided. <button class="text-warning underline font-medium" data-action="update-fitout">Update Fitout & Financing</button></p>
    </div>
    `}
  </section>

  <!-- Detailed Break-Even Analysis -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Break-Even Analysis</h2>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="bg-surface-2 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground/60 mb-1">Operating Break-Even</p>
        <p class="text-xl font-bold text-foreground">${formatCurrency(breakEven.operatingBreakEven)}</p>
        <p class="text-xs text-muted-foreground/40">${project.period.toLowerCase()}</p>
      </div>
      <div class="bg-info/10 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground/60 mb-1">Break-Even with Owner's Return</p>
        <p class="text-xl font-bold text-info">${formatCurrency(breakEven.ownersReturnBreakEven)}</p>
        <p class="text-xs text-muted-foreground/40">${project.period.toLowerCase()}</p>
      </div>
    </div>

    <h3 class="text-sm font-medium text-muted-foreground mb-2">Cost Structure</h3>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b"><th class="py-2 text-left text-muted-foreground/60">Cost Category</th><th class="py-2 text-right text-muted-foreground/60">${project.period} Amount</th><th class="py-2 text-right text-muted-foreground/60">% of Sales</th></tr>
      </thead>
      <tbody>
        <tr class="border-b"><td class="py-2">Occupancy (Rent)</td><td class="py-2 text-right font-medium">${formatCurrency(scenario.rent)}</td><td class="py-2 text-right">${formatPercent((scenario.rent / scenario.enteredSales) * 100)}</td></tr>
        <tr class="border-b"><td class="py-2">Labour (Variable)</td><td class="py-2 text-right font-medium">${formatCurrency(scenario.enteredSales * scenario.variableLabour / 100)}</td><td class="py-2 text-right">${formatPercent(scenario.variableLabour)}</td></tr>
        <tr class="border-b"><td class="py-2">Cost of Goods Sold</td><td class="py-2 text-right font-medium">${formatCurrency(scenario.enteredSales * scenario.variableCogs / 100)}</td><td class="py-2 text-right">${formatPercent(scenario.variableCogs)}</td></tr>
        <tr class="border-b"><td class="py-2">Other Variable Costs</td><td class="py-2 text-right font-medium">${formatCurrency(scenario.enteredSales * scenario.variableOther / 100)}</td><td class="py-2 text-right">${formatPercent(scenario.variableOther)}</td></tr>
        <tr class="border-b font-medium"><td class="py-2">Total Fixed Costs</td><td class="py-2 text-right">${formatCurrency(breakEven.totalFixedCosts)}</td><td class="py-2 text-right">-</td></tr>
        <tr class="font-medium bg-surface-2"><td class="py-2">Contribution Margin</td><td class="py-2 text-right">-</td><td class="py-2 text-right">${formatPercent(breakEven.contributionMargin)}</td></tr>
      </tbody>
    </table>
  </section>

  <!-- Sales Projections -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Sales Projections (12 Months)</h2>
    ${forecast ? `
    <div class="mb-4">
      ${forecast.breakEvenMonthIndex !== null ? `
      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p class="text-sm text-green-800 font-medium">Crosses into profitability: <strong>Month ${forecast.breakEvenMonthIndex}</strong></p>
      </div>
      ` : `
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p class="text-sm text-red-800">Based on current projections, the business does not achieve profitability within 12 months.</p>
      </div>
      `}
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-surface-2">
            <th class="py-2 px-2 text-left text-muted-foreground">Month</th>
            <th class="py-2 px-2 text-right text-muted-foreground">Revenue</th>
            <th class="py-2 px-2 text-right text-muted-foreground">Costs</th>
            <th class="py-2 px-2 text-right text-muted-foreground">Surplus/Deficit</th>
          </tr>
        </thead>
        <tbody>
          ${forecast.months.map(m => `
          <tr class="border-b ${m.surplus >= 0 && forecast!.breakEvenMonthIndex === m.monthIndex ? 'bg-green-50' : ''}">
            <td class="py-2 px-2 font-medium">${m.label}${m.surplus >= 0 && forecast!.breakEvenMonthIndex === m.monthIndex ? ' <span class="text-green-600 text-xs">(Break-even)</span>' : ''}</td>
            <td class="py-2 px-2 text-right">${formatCurrency(m.revenue)}</td>
            <td class="py-2 px-2 text-right">${formatCurrency(m.totalCosts)}</td>
            <td class="py-2 px-2 text-right ${m.surplus >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(m.surplus)}</td>
          </tr>
          `).join('')}
          <tr class="bg-muted font-medium">
            <td class="py-2 px-2">Annual Total</td>
            <td class="py-2 px-2 text-right">${formatCurrency(forecast.annualRevenue)}</td>
            <td class="py-2 px-2 text-right">-</td>
            <td class="py-2 px-2 text-right ${forecast.annualSurplus >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(forecast.annualSurplus)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : `
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <p class="text-sm text-warning">Sales projections require completion of the Detailed Break-Even module.</p>
    </div>
    `}
  </section>

  <!-- Key Assumptions -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">Key Assumptions</h2>
    <ul class="text-sm text-muted-foreground space-y-2">
      <li>Projected ${project.period.toLowerCase()} sales: ${formatCurrency(scenario.enteredSales)}</li>
      <li>Owner's desired return: ${formatCurrency(scenario.ownersReturn)} ${project.period.toLowerCase()}</li>
      <li>COGS as percentage of sales: ${formatPercent(scenario.variableCogs)}</li>
      <li>Labour as percentage of sales: ${formatPercent(scenario.variableLabour)}</li>
      ${scenario.isFranchise ? `<li>Franchise royalty: ${formatPercent(scenario.franchiseRoyaltyPercent || 0)}</li>` : ''}
      ${hasHoursData ? `<li>Weekly trading hours: ${weeklyHours.toFixed(1)} hours</li>` : ''}
    </ul>
  </section>

  ${project.siteListingUrl ? `
  <section class="mb-8">
    <h2 class="text-lg font-semibold text-foreground mb-3 pb-2 border-b">References</h2>
    <p class="text-sm text-muted-foreground">
      Property listing reference:
      <a href="${project.siteListingUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${project.siteListingUrl}</a>
    </p>
  </section>
  ` : ''}

  <!-- Disclaimer -->
  <section class="mt-8 pt-4 border-t border-slate-200">
    <p class="text-xs text-muted-foreground/40 italic leading-relaxed">
      <strong>Disclaimer:</strong> This plan is for information purposes only and does not replace independent professional advice.
      Financial projections are based on assumptions that may not reflect actual results.
      Always consult with qualified accountants, lawyers, and business advisers before making business decisions.
    </p>
  </section>
</div>
  `;

  return html;
}

export async function generateDetailedPlan(
  project: ProjectData,
  activeScenario: 'scenario1' | 'scenario2' | 'scenario3',
  projectId?: string | null
): Promise<{ html: string; hoursVisualizationData: any; hasServiceShifts: boolean }> {
  const scenario = project.detailedBreakEven[activeScenario];
  const fitout = project.fitoutFinancing[activeScenario];
  const breakEven = calculateBreakEvenResults(scenario, project.period);
  const viability = getViabilityStatus(scenario.enteredSales, breakEven.operatingBreakEven, breakEven.ownersReturnBreakEven);
  const bp = project.businessPlan;

  const businessName = bp?.brandName || project.siteName || 'Your Business';
  const address = project.siteAddress || project.location?.address || 'Address not specified';
  const businessType = bp?.businessCategory || project.venueType || 'Hospitality Business';

  const annualRent = scenario.rent * (project.period === 'Weekly' ? 52 : project.period === 'Monthly' ? 12 : 1);
  const premisesSize = project.location?.propertySize || project.propertyListingParsedData?.premisesSize;
  const annualSales = scenario.enteredSales * (project.period === 'Weekly' ? 52 : project.period === 'Monthly' ? 12 : 1);

  const hasStaffingData = project.labourCosting && project.labourCosting.staffRoles.length > 0;
  const staffingSummary = hasStaffingData ? getStaffingSummary(project.labourCosting!.staffRoles) : null;

  const capitalLineItems = buildCapitalLineItems(fitout);

  const summary = calculateProjectSummary(project);
  let forecast: ForecastResult | null = null;
  try {
    forecast = generateForecast(project, summary);
  } catch {
    forecast = null;
  }

  const scenarioLabel = activeScenario === 'scenario1' ? 'Scenario 1' : activeScenario === 'scenario2' ? 'Scenario 2' : 'Scenario 3';

  const detailedHours = await generateDetailedHoursVisualization(project.timeFormatPreference || '12h');

  const logoHtml = projectId ? await generateUploadsHtml(projectId) : '';
  const floorPlanHtml = projectId ? await generateFloorPlanHtml(projectId) : '';
  const stylePhotosHtml = projectId ? await generateStylePhotosHtml(projectId) : '';
  const menuPhotosHtml = projectId ? await generateMenuPhotosHtml(projectId) : '';
  const appendixHtml = projectId ? await generateAppendixHtml(projectId) : '';

  let html = `
<div class="business-plan detailed-plan">
  <div class="text-center mb-8 pb-6 border-b-2 border-slate-200">
    ${logoHtml}
    <h1 class="text-3xl font-bold text-foreground mb-2">Detailed Business Plan</h1>
    <h2 class="text-xl text-muted-foreground mb-4">${escapeHtml(businessName)}</h2>
    <p class="text-sm text-muted-foreground/60">Prepared ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    ${project.scenarioMode === 'multi' ? `<p class="text-sm text-blue-600 mt-2">Based on ${scenarioLabel}</p>` : ''}
  </div>

  <!-- 1. Executive Summary -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">1. Executive Summary</h2>
    <div class="bg-surface-2 rounded-lg p-5 mb-4">
      <div class="space-y-3 text-sm text-muted-foreground">
        <p><strong>Concept:</strong> ${escapeHtml(businessType)} at ${escapeHtml(address)}</p>
        <p class="text-base"><strong>Required Sales to Break-Even:</strong> <span class="text-xl font-bold text-info">${formatCurrency(breakEven.ownersReturnBreakEven)}</span> <span class="text-muted-foreground/60">${project.period.toLowerCase()}</span></p>
        <p><strong>Viability Status:</strong> <span class="font-semibold ${viability.color === 'green' ? 'text-success' : viability.color === 'amber' ? 'text-warning' : 'text-destructive'}">${viability.status}</span></p>
        <p><strong>Total Startup Capital:</strong> ${formatCurrency(fitout.startupCapital)}</p>
        <p><strong>Projected Annual Revenue:</strong> ${formatCurrency(annualSales)}</p>
        ${forecast?.breakEvenMonthIndex ? `<p><strong>Profitability Achieved:</strong> Month ${forecast.breakEvenMonthIndex}</p>` : ''}
      </div>
    </div>
    ${bp?.businessConcept ? `<p class="text-muted-foreground leading-relaxed">${escapeHtml(bp.businessConcept)}</p>` : ''}
  </section>

  <!-- 2. Business Description -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">2. Business Description</h2>
    <table class="w-full text-sm mb-4">
      <tbody>
        <tr class="border-b"><td class="py-3 text-muted-foreground/60 w-1/3">Business Name</td><td class="py-3 font-medium">${escapeHtml(businessName)}</td></tr>
        <tr class="border-b"><td class="py-3 text-muted-foreground/60">Business Type</td><td class="py-3 font-medium">${escapeHtml(businessType)}</td></tr>
        ${bp?.ownership?.businessStructure ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Business Structure</td><td class="py-3 font-medium">${bp.ownership.businessStructure === 'soleTrader' ? 'Sole Trader' : bp.ownership.businessStructure === 'partnership' ? 'Partnership' : bp.ownership.businessStructure === 'company' ? 'Pty Ltd Company' : bp.ownership.businessStructure === 'trust' ? 'Trust' : 'Other'}</td></tr>` : ''}
        ${bp?.ownership?.owners ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Owners</td><td class="py-3 font-medium">${escapeHtml(bp.ownership.owners)}</td></tr>` : ''}
        ${scenario.isFranchise ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Franchise</td><td class="py-3 font-medium">${escapeHtml(scenario.franchiseName || 'Yes')}</td></tr>` : ''}
      </tbody>
    </table>
    ${bp?.uniqueSellingPoints ? `<div class="mt-4"><h3 class="font-semibold text-muted-foreground mb-2">Unique Selling Points</h3><p class="text-muted-foreground">${escapeHtml(bp.uniqueSellingPoints)}</p></div>` : ''}
    ${bp?.targetMarket ? `<div class="mt-4"><h3 class="font-semibold text-muted-foreground mb-2">Target Market</h3><p class="text-muted-foreground">${escapeHtml(bp.targetMarket)}</p></div>` : ''}
    ${stylePhotosHtml}
    ${bp?.willServeAlcohol !== undefined || bp?.willHaveGamingOrBetting !== undefined ? `
    <div class="mt-4">
      <h3 class="font-semibold text-muted-foreground mb-2">Licensing & Compliance</h3>
      <table class="w-full text-sm">
        <tbody>
          ${bp?.willServeAlcohol !== undefined ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60 w-1/3">Alcohol Licensed</td><td class="py-2 font-medium">${bp.willServeAlcohol ? 'Yes' : 'No'}</td></tr>` : ''}
          ${bp?.willServeAlcohol && bp?.liquorLicenceType ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Liquor Licence Type</td><td class="py-2 font-medium">${escapeHtml(bp.liquorLicenceType === 'not-sure' ? 'To be determined' : bp.liquorLicenceType === 'other' && bp.liquorLicenceOtherText ? bp.liquorLicenceOtherText : bp.liquorLicenceType.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))}</td></tr>` : ''}
          ${bp?.willHaveGamingOrBetting !== undefined ? `<tr class="border-b"><td class="py-2 text-muted-foreground/60">Gaming Machines/Betting</td><td class="py-2 font-medium">${bp.willHaveGamingOrBetting ? 'Yes' : 'No'}</td></tr>` : ''}
        </tbody>
      </table>
      ${bp?.willServeAlcohol && bp?.liquorLicenceType === 'not-sure' ? `<p class="text-xs text-info mt-2 bg-info/10 p-2 rounded">⚠️ Recommendation: Confirm the required liquor licence type with your state's licensing authority before proceeding.</p>` : ''}
    </div>
    ` : ''}
  </section>

  <!-- 3. Location & Site -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">3. Location & Site Assessment</h2>
    <table class="w-full text-sm mb-4">
      <tbody>
        <tr class="border-b"><td class="py-3 text-muted-foreground/60 w-1/3">Address</td><td class="py-3 font-medium">${escapeHtml(address)}</td></tr>
        ${premisesSize ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Floor Area</td><td class="py-3 font-medium">${premisesSize} sqm</td></tr>` : ''}
        <tr class="border-b"><td class="py-3 text-muted-foreground/60">Annual Rent</td><td class="py-3 font-medium">${formatCurrency(annualRent)} p.a.</td></tr>
        ${premisesSize ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Rent per sqm</td><td class="py-3 font-medium">${formatCurrency(annualRent / premisesSize)} p.a.</td></tr>` : ''}
        <tr class="border-b"><td class="py-3 text-muted-foreground/60">Occupancy Type</td><td class="py-3 font-medium">${scenario.occupancyType === 'purchasing' ? 'Property Purchase' : 'Leasing'}</td></tr>
      </tbody>
    </table>
    ${project.locationSuitabilityScore ? `<div class="mt-4 bg-surface-2 p-4 rounded-lg"><p class="text-sm"><span class="text-muted-foreground/60">Location Suitability Score:</span> <span class="font-bold text-lg">${project.locationSuitabilityScore}/100</span></p></div>` : ''}
    ${floorPlanHtml}
  </section>

  <!-- 4. Menu Overview -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">4. Menu Overview</h2>
    ${generateMenuHtml(project)}
    ${menuPhotosHtml}
  </section>

  <!-- 5. Operations Plan -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">5. Operations Plan</h2>

    <!-- a. Hours of Operation -->
    <div class="mb-8">
      <h3 class="text-lg font-bold text-foreground mb-4 mt-2">a. Hours of Operation</h3>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        The venue will operate during the hours shown below. ${detailedHours.hasServiceShifts ? 'Service periods, preparation, and close-down times are reflected where applicable.' : 'Operating hours reflect when the venue is open to customers.'}
      </p>
      <div id="hours-visualization-placeholder" data-component="hours-schedule-chart"></div>
    </div>

    <!-- b. Roles and Staffing -->
    <div class="mb-8 mt-10">
      <h3 class="text-lg font-bold text-foreground mb-4">b. Roles and Staffing</h3>
      ${hasStaffingData && staffingSummary ? `
      <p class="text-sm text-muted-foreground mb-3 leading-relaxed">${staffingSummary.narrativeSentence}</p>

      <div class="grid grid-cols-2 gap-6 mb-4">
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-2">Employment Structure</h4>
          <table class="w-full text-sm border-collapse">
            <tbody>
              ${staffingSummary.statusBreakdown['Full Time'] > 0 ? `<tr class="border-b"><td class="py-2 text-muted-foreground">Full-time staff</td><td class="py-2 text-right font-medium">${staffingSummary.statusBreakdown['Full Time']}</td></tr>` : ''}
              ${staffingSummary.statusBreakdown['Part Time'] > 0 ? `<tr class="border-b"><td class="py-2 text-muted-foreground">Part-time staff</td><td class="py-2 text-right font-medium">${staffingSummary.statusBreakdown['Part Time']}</td></tr>` : ''}
              ${staffingSummary.statusBreakdown['Casual'] > 0 ? `<tr class="border-b"><td class="py-2 text-muted-foreground">Casual staff</td><td class="py-2 text-right font-medium">${staffingSummary.statusBreakdown['Casual']}</td></tr>` : ''}
              <tr class="border-t-2 bg-surface-2"><td class="py-2 font-semibold text-muted-foreground">Total team members</td><td class="py-2 text-right font-bold">${staffingSummary.totalStaff}</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-2">Key Roles</h4>
          <table class="w-full text-sm border-collapse">
            <tbody>
              ${Object.entries(staffingSummary.roleBreakdown).map(([role, count]) => `
              <tr class="border-b"><td class="py-2 text-muted-foreground">${role}</td><td class="py-2 text-right font-medium">${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4">
        <h4 class="text-sm font-medium text-muted-foreground mb-2">Operational Roster Overview</h4>
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-b-2 bg-surface-2">
              <th class="py-2 px-2 text-left text-muted-foreground">Role</th>
              <th class="py-2 px-2 text-center text-muted-foreground">Employment Type</th>
              <th class="py-2 px-2 text-right text-muted-foreground">Indicative Hours/Week</th>
            </tr>
          </thead>
          <tbody>
            ${project.labourCosting!.staffRoles.map(role => `
            <tr class="border-b">
              <td class="py-2 px-2 font-medium">${role.roleName}</td>
              <td class="py-2 px-2 text-center">${role.employmentStatus || 'Not specified'}</td>
              <td class="py-2 px-2 text-right">${role.hoursPerWeek}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <p class="text-sm text-warning">Staffing plan not yet specified. Complete the Labour Costing section to include staffing details in this plan.</p>
      </div>
      `}
    </div>

    <!-- c. Technology & Systems -->
    <div class="mb-8 mt-10">
      <h3 class="text-lg font-bold text-foreground mb-4">c. Technology & Systems</h3>
      ${bp?.technologyStack ? `
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        The business will utilise the following technology systems to support efficient daily operations, accurate reporting, and positive customer experience.
      </p>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 bg-surface-2">
            <th class="py-2 px-3 text-left text-muted-foreground">System</th>
            <th class="py-2 px-3 text-left text-muted-foreground">Solution</th>
          </tr>
        </thead>
        <tbody>
          ${bp.technologyStack.posSystem ? `<tr class="border-b"><td class="py-2 px-3 text-muted-foreground">POS System</td><td class="py-2 px-3 font-medium">${formatPOSSystemName(bp.technologyStack.posSystem, bp.technologyStack.posSystemOther)}</td></tr>` : ''}
          ${bp.technologyStack.orderingModel ? `<tr class="border-b"><td class="py-2 px-3 text-muted-foreground">Ordering Channels</td><td class="py-2 px-3 font-medium">${bp.technologyStack.orderingModel === 'inStoreOnly' ? 'In-store only' : bp.technologyStack.orderingModel === 'mixed' ? 'Mixed (in-store, online, delivery platforms)' : bp.technologyStack.orderingModel === 'aggregatorOnly' ? 'Delivery platforms (e.g., Uber Eats, DoorDash)' : bp.technologyStack.orderingModel}</td></tr>` : ''}
          ${bp.technologyStack.takesBookings !== undefined ? `<tr class="border-b"><td class="py-2 px-3 text-muted-foreground">Booking System</td><td class="py-2 px-3 font-medium">${bp.technologyStack.takesBookings ? (bp.technologyStack.bookingSystemType === 'manual' ? 'Manual reservation diary' : bp.technologyStack.bookingSystemType === 'other' && bp.technologyStack.bookingSystemOther ? bp.technologyStack.bookingSystemOther : bp.technologyStack.bookingSystemType || 'Yes') : 'Not applicable'}</td></tr>` : ''}
          ${bp.technologyStack.accountingSystem ? `<tr class="border-b"><td class="py-2 px-3 text-muted-foreground">Accounting Software</td><td class="py-2 px-3 font-medium">${bp.technologyStack.accountingSystem === 'undecided' ? 'To be confirmed' : bp.technologyStack.accountingSystem}</td></tr>` : ''}
        </tbody>
      </table>
      ` : `
      <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <p class="text-sm text-warning">Technology systems not yet specified. Complete the Business Planning section to include technology details in this plan.</p>
      </div>
      `}
    </div>

    <!-- d. Sales Breakup -->
    <div class="mb-8 mt-10">
      <h3 class="text-lg font-bold text-foreground mb-4">d. Sales Breakup</h3>
      <div class="bg-info/10 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-info font-medium mb-1">Sales Distribution Overview</p>
        <p class="text-sm text-blue-600">Sales breakup will be detailed here based on the Sales Predictions and channel mix, including distribution by service period and order type.</p>
      </div>
    </div>
  </section>

  ${bp?.operatorExperience ? `
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">6. Management & Capability</h2>
    <table class="w-full text-sm mb-4">
      <tbody>
        ${bp.operatorExperience.hospitalityExperienceYears ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60 w-1/3">Hospitality Experience</td><td class="py-3 font-medium">${bp.operatorExperience.hospitalityExperienceYears} years</td></tr>` : ''}
        ${bp.operatorExperience.managementExperienceYears ? `<tr class="border-b"><td class="py-3 text-muted-foreground/60">Management Experience</td><td class="py-3 font-medium">${bp.operatorExperience.managementExperienceYears} years</td></tr>` : ''}
      </tbody>
    </table>
    ${bp.operatorExperience.relevantExperienceDescription ? `<p class="text-muted-foreground mb-4">${bp.operatorExperience.relevantExperienceDescription}</p>` : ''}
    ${bp.operatorExperience.strengths && bp.operatorExperience.strengths.length > 0 ? `
    <div class="mt-4"><h3 class="font-semibold text-muted-foreground mb-2">Key Strengths</h3><ul class="text-sm text-muted-foreground space-y-1">${bp.operatorExperience.strengths.map(s => `<li>- ${s}</li>`).join('')}</ul></div>
    ` : ''}
  </section>
  ` : ''}

  <!-- Financial Plan -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">${bp?.operatorExperience ? '7' : '6'}. Financial Plan</h2>

    <div class="bg-${viability.color === 'green' ? 'green' : viability.color === 'amber' ? 'amber' : 'red'}-50 border border-${viability.color === 'green' ? 'green' : viability.color === 'amber' ? 'amber' : 'red'}-200 rounded-lg p-4 mb-6">
      <p class="text-lg font-bold text-${viability.color === 'green' ? 'green' : viability.color === 'amber' ? 'amber' : 'red'}-700 mb-1">Viability Assessment: ${viability.status}</p>
      <p class="text-sm text-muted-foreground">${viability.description}</p>
    </div>

    <h3 class="font-semibold text-muted-foreground mb-3">Break-Even Analysis</h3>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-surface-2 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground/60 mb-1">Operating Break-Even</p>
        <p class="text-xl font-bold text-foreground">${formatCurrency(breakEven.operatingBreakEven)}</p>
        <p class="text-xs text-muted-foreground/40">${project.period.toLowerCase()}</p>
      </div>
      <div class="bg-info/10 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground/60 mb-1">With Owner's Return</p>
        <p class="text-xl font-bold text-info">${formatCurrency(breakEven.ownersReturnBreakEven)}</p>
        <p class="text-xs text-muted-foreground/40">${project.period.toLowerCase()}</p>
      </div>
      <div class="bg-green-50 rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground/60 mb-1">Contribution Margin</p>
        <p class="text-xl font-bold text-success">${formatPercent(breakEven.contributionMargin)}</p>
      </div>
    </div>

    <h3 class="font-semibold text-muted-foreground mb-3">Startup Capital Requirements</h3>
    <table class="w-full text-sm mb-6">
      <tbody>
        ${capitalLineItems.map(item => `<tr class="border-b"><td class="py-2 text-muted-foreground">${item.label}</td><td class="py-2 text-right font-medium">${formatCurrency(item.amount)}</td></tr>`).join('')}
        <tr class="bg-muted"><td class="py-2 font-bold">Total Startup Capital</td><td class="py-2 text-right font-bold text-lg">${formatCurrency(fitout.startupCapital)}</td></tr>
      </tbody>
    </table>

    ${fitout.loanAmount > 0 ? `
    <h3 class="font-semibold text-muted-foreground mb-3">Funding Structure</h3>
    <table class="w-full text-sm mb-6">
      <tbody>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Loan Amount</td><td class="py-2 text-right font-medium">${formatCurrency(fitout.loanAmount)}</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Interest Rate</td><td class="py-2 text-right font-medium">${fitout.loanInterest}%</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Loan Term</td><td class="py-2 text-right font-medium">${fitout.loanTerm} years</td></tr>
        <tr class="border-b"><td class="py-2 text-muted-foreground/60">Owner's Capital Required</td><td class="py-2 text-right font-medium">${formatCurrency(fitout.startupCapital - fitout.loanAmount)}</td></tr>
      </tbody>
    </table>
    ` : ''}

    ${forecast ? `
    <h3 class="font-semibold text-muted-foreground mb-3">12-Month Sales Projections</h3>
    ${forecast.breakEvenMonthIndex !== null ? `
    <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <p class="text-sm text-green-800 font-medium">Crosses into profitability: <strong>Month ${forecast.breakEvenMonthIndex}</strong></p>
    </div>
    ` : ''}
    <table class="w-full text-sm mb-6">
      <thead><tr class="border-b bg-surface-2"><th class="py-2 px-2 text-left text-muted-foreground">Month</th><th class="py-2 px-2 text-right text-muted-foreground">Revenue</th><th class="py-2 px-2 text-right text-muted-foreground">Costs</th><th class="py-2 px-2 text-right text-muted-foreground">Surplus</th></tr></thead>
      <tbody>
        ${forecast.months.map(m => `
        <tr class="border-b ${m.surplus >= 0 && forecast!.breakEvenMonthIndex === m.monthIndex ? 'bg-green-50' : ''}">
          <td class="py-2 px-2">${m.label}</td>
          <td class="py-2 px-2 text-right">${formatCurrency(m.revenue)}</td>
          <td class="py-2 px-2 text-right">${formatCurrency(m.totalCosts)}</td>
          <td class="py-2 px-2 text-right ${m.surplus >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(m.surplus)}</td>
        </tr>
        `).join('')}
        <tr class="bg-muted font-medium">
          <td class="py-2 px-2">Annual Total</td>
          <td class="py-2 px-2 text-right">${formatCurrency(forecast.annualRevenue)}</td>
          <td class="py-2 px-2 text-right">-</td>
          <td class="py-2 px-2 text-right ${forecast.annualSurplus >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(forecast.annualSurplus)}</td>
        </tr>
      </tbody>
    </table>
    ` : ''}
  </section>

  <!-- Risk Analysis -->
  <section class="mb-10">
    <h2 class="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-brand">${bp?.operatorExperience ? '8' : '7'}. Risk Analysis</h2>
    <table class="w-full text-sm">
      <thead><tr class="border-b bg-surface-2"><th class="py-2 px-3 text-left text-muted-foreground">Risk</th><th class="py-2 px-3 text-left text-muted-foreground">Mitigation Strategy</th></tr></thead>
      <tbody>
        <tr class="border-b"><td class="py-3 px-3 font-medium">Sales below projections</td><td class="py-3 px-3">Monitor sales weekly, adjust marketing spend, review pricing strategy</td></tr>
        <tr class="border-b"><td class="py-3 px-3 font-medium">Cost overruns</td><td class="py-3 px-3">Regular budget reviews, negotiate fixed-price contracts, maintain contingency fund</td></tr>
        <tr class="border-b"><td class="py-3 px-3 font-medium">Staff shortages</td><td class="py-3 px-3">Competitive wages, cross-training, maintain casual pool</td></tr>
        <tr class="border-b"><td class="py-3 px-3 font-medium">Supply chain disruption</td><td class="py-3 px-3">Multiple supplier relationships, adequate stock levels</td></tr>
        <tr class="border-b"><td class="py-3 px-3 font-medium">Economic downturn</td><td class="py-3 px-3">Flexible cost structure, value menu options, loyalty program</td></tr>
      </tbody>
    </table>
  </section>

  ${appendixHtml}

  <!-- Disclaimer -->
  <section class="mt-10 pt-6 border-t-2 border-slate-200">
    <h2 class="text-lg font-semibold text-muted-foreground mb-3">Disclaimer</h2>
    <p class="text-xs text-muted-foreground/60 leading-relaxed">
      This business plan has been prepared for information purposes only and does not constitute financial, legal, or professional advice.
      The projections and assumptions contained herein are estimates based on information provided and may not reflect actual results.
      Past performance is not indicative of future results. Market conditions, economic factors, and business circumstances can change rapidly.
    </p>
    <p class="text-xs text-muted-foreground/60 leading-relaxed mt-2">
      Before making any business decisions, always consult with qualified professionals including accountants, lawyers, and business advisers.
      Independent verification of all financial projections and assumptions is strongly recommended.
    </p>
  </section>
</div>
  `;

  return {
    html,
    hoursVisualizationData: detailedHours.visualizationData,
    hasServiceShifts: detailedHours.hasServiceShifts,
  };
}
