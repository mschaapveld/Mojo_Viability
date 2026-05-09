export type Period = 'Weekly' | 'Monthly' | 'Yearly';

export type BusinessOrigin = "new" | "existing";
export type ScenarioMode = "single" | "multi";
export type FitoutMode = "newFitout" | "existingBusiness";

export type SeasonalityProfileName = "Flat" | "SummerPeak" | "WinterPeak";

export type HolidayBumpProfileName =
  | "None"
  | "SchoolHolidays"
  | "PublicHolidays"
  | "Both";

export type VenueType =
  | "Small bar"
  | "Small restaurant"
  | "Small restaurant with bar"
  | "Medium restaurant"
  | "Large restaurant"
  | "Live music venue"
  | "Nightclub"
  | "Pub / Tavern"
  | "Cafe"
  | "Quick service restaurant (QSR)";

export type OrderSourceKey =
  | "orderInVenue"
  | "phone"
  | "appBiteBusiness"
  | "appOther"
  | "website"
  | "uberDelivery"
  | "uberPickup"
  | "doordashDelivery"
  | "doordashPickup";

export interface OrderSourceBreakdownItem {
  key: OrderSourceKey;
  label: string;
  percent: number;
}

export interface CustomFixedCost {
  id: string;
  name: string;
  value: number;
}

export interface DetailedBreakEvenScenario {
  enteredSales: number;
  ownersReturn: number;
  rent: number;
  labourMinimumCost: number;
  variableCogs: number;
  variableLabour: number;
  variableOther: number;
  insurance: number;
  accounting: number;
  marketing: number;
  utilities: number;
  otherFixed: number;
  customFixedCosts: CustomFixedCost[];
  isFranchise?: boolean;
  franchiseName?: string;
  franchiseRoyaltyPercent?: number;
  franchiseMarketingPercent?: number;
  rentTurnoverEnabled?: boolean;
  rentTurnoverPercent?: number;
  rentTurnoverSettlement?: 'quarterly' | 'monthly' | 'annual';
  occupancyType?: 'renting' | 'purchasing';
  loanType?: 'principalAndInterest' | 'interestOnly';
  propertyPurchasePrice?: number;
  propertyDeposit?: number;
  propertyClosingCosts?: number;
  propertyStampDuty?: number;
  propertyGstPayable?: boolean;
  propertyInterestRate?: number;
  propertyLoanTerm?: number;
  venueType?: VenueType | null;
}

export interface FitoutFinancingScenario {
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
  customSetupCosts: Array<{ id: string; name: string; amount: number }>;
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

export interface VenueOpeningWindow {
  id: string;
  openTime: string;
  closeTime: string;
}

export interface VenueDayHours {
  isOpen: boolean;
  windows: VenueOpeningWindow[];
}

export interface DaySchedule {
  open: boolean;
  breakfast: { start: string; end: string };
  lunch: { start: string; end: string };
  dinner: { start: string; end: string };
  prep: { start: string; end: string };
  shutdown: { start: string; end: string };
}

export interface StaffRole {
  id: string;
  roleName: string;
  customName?: string;
  hoursPerWeek: number;
  hourlyRate: number;
  loading: number;
  employmentStatus?: 'Casual' | 'Part Time' | 'Full Time';
  payType?: 'Hourly' | 'Salaried';
  salary?: number;
  includeSuperannuation?: boolean;
  category?: 'Management' | 'Kitchen' | 'Front of House' | 'Other';
}

export interface LabourCostingData {
  selectedAward: 'fastFood' | 'restaurant' | 'retail';
  staffRoles: StaffRole[];
  weeklySales: number;
  useManualSales?: boolean;
}

export interface LocationData {
  address?: string | null;
  propertySize?: number | null;
  annualRent?: number | null;
  useManualRent?: boolean;
  frontageType?: "MainRoad" | "SideStreet" | "ShoppingCentre" | "NeighbourhoodStrip" | null;
  parkingQuality?: "None" | "Street" | "OnsiteLimited" | "OnsiteGood" | null;
  visibility?: "Poor" | "Average" | "Strong" | "Prime" | null;
  nearbyActivity?: "Low" | "Moderate" | "Strong" | "High" | null;
  catchmentStrength?: "Weak" | "Moderate" | "Strong" | "VeryStrong" | null;
}

export type BusinessTypeClassification =
  | "Burger"
  | "Pizza"
  | "Taco"
  | "Cafe"
  | "Coffee"
  | "Pub"
  | "Bar"
  | "Restaurant"
  | "Asian"
  | "Indian"
  | "Thai"
  | "Sushi"
  | "Mexican"
  | "Italian"
  | "Bakery"
  | "IceCream"
  | "JuiceBar"
  | "Other";

export interface MojoOpportunity {
  type: 'no_direct_ordering' | 'aggregator_only' | 'no_booking_system' | 'missing_business_details';
  description: string;
  referralCallout?: string;
}

export type PropertyDataSource = 'parsed' | 'manual' | 'uploaded';
export type ParsingErrorType = 'dynamic_content' | 'extraction_failed' | 'fetch_failed';

export interface PropertyListingParsedData {
  sourceUrl: string;
  extractedAt: string;
  address?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  premisesSize?: number | null;
  rentAmount?: number | null;
  rentPeriod?: 'weekly' | 'monthly' | 'annual' | null;
  outgoings?: number | null;
  bondOrDeposit?: number | null;
  leaseTerm?: string | null;
  leaseIncentives?: string | null;
  agentName?: string | null;
  agencyName?: string | null;
  inclusions?: string | null;
  parsingSuccess: boolean;
  parsingError?: string | null;
  parsingErrorType?: ParsingErrorType | null;
  dataSource?: PropertyDataSource | null;
}

export interface BusinessWebsiteParsedData {
  sourceUrl: string;
  extractedAt: string;
  businessName?: string | null;
  businessAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  hoursOfOperation?: string | null;
  businessType?: BusinessTypeClassification | null;
  hasOnsiteOrdering?: boolean | null;
  hasThirdPartyOrdering?: boolean | null;
  detectedAggregators?: string[] | null;
  hasBookingSystem?: boolean | null;
  detectedBookingProvider?: string | null;
  mojoOpportunities?: MojoOpportunity[];
  parsingSuccess: boolean;
  parsingError?: string | null;
}

export type BusinessPlanType = 'simple' | 'detailed';

export type BusinessStructure =
  | 'soleTrader'
  | 'partnership'
  | 'company'
  | 'trust'
  | 'other';

export type POSSystem =
  | 'abacus'
  | 'bepoz'
  | 'clover'
  | 'idealpos'
  | 'imagatec'
  | 'impos'
  | 'kounta'
  | 'lightspeed'
  | 'ordermate'
  | 'revel'
  | 'square'
  | 'swiftpos'
  | 'toast'
  | 'other'
  | 'undecided';

export type AccountingSystem =
  | 'xero'
  | 'myob'
  | 'quickbooks'
  | 'other'
  | 'undecided';

export type OrderingModel =
  | 'inStoreOnly'
  | 'onlineOrdering'
  | 'appOrdering'
  | 'aggregatorOnly'
  | 'mixed';

export interface ProfessionalServicesData {
  hasAccountant?: boolean;
  accountantName?: string | null;
  hasLawyer?: boolean;
  lawyerName?: string | null;
  hasBookkeeper?: boolean;
  bookkeeperName?: string | null;
  hasInteriorDesigner?: boolean;
  interiorDesignerName?: string | null;
  hasBrandDesigner?: boolean;
  brandDesignerName?: string | null;
  hasWebsiteDesigner?: boolean;
  websiteDesignerName?: string | null;
  hasFinanceBroker?: boolean;
  financeBrokerName?: string | null;
  needsHelpSourcingServices?: boolean;
}

export interface TechnologyStackData {
  posSystem?: POSSystem | null;
  posSystemOther?: string | null;
  orderingModel?: OrderingModel | null;
  onlineOrderingProvider?: string | null;
  aggregatorsUsed?: string[] | null;
  takesBookings?: boolean;
  bookingSystemType?: string | null;
  bookingSystemOther?: string | null;
  accountingSystem?: AccountingSystem | null;
  accountingSystemOther?: string | null;
}

export interface OperationalReadinessData {
  hasEquipmentSupplier?: boolean;
  equipmentSupplierName?: string | null;
  hasFoodSupplier?: boolean;
  foodSupplierName?: string | null;
  hasBeverageSupplier?: boolean;
  beverageSupplierName?: string | null;
  hasPackagingSupplier?: boolean;
  packagingSupplierName?: string | null;
}

export interface OwnershipData {
  businessStructure?: BusinessStructure | null;
  businessStructureOther?: string | null;
  owners?: string | null;
  directors?: string | null;
  hasSilentInvestors?: boolean;
  silentInvestorDetails?: string | null;
  equitySplit?: string | null;
}

export interface OperatorExperienceData {
  hospitalityExperienceYears?: number | null;
  managementExperienceYears?: number | null;
  relevantExperienceDescription?: string | null;
  strengths?: string[] | null;
  supportNeeded?: string[] | null;
}

export type BusinessPlanOpportunityType =
  | 'no_direct_ordering'
  | 'aggregator_only'
  | 'no_booking_system'
  | 'manual_booking_system'
  | 'missing_business_details'
  | 'needs_accountant'
  | 'needs_lawyer'
  | 'needs_bookkeeper'
  | 'needs_interior_designer'
  | 'needs_brand_designer'
  | 'needs_website_designer'
  | 'needs_finance_broker'
  | 'needs_pos_system'
  | 'needs_accounting_system'
  | 'needs_equipment_supplier';

export interface BusinessPlanOpportunity {
  type: BusinessPlanOpportunityType;
  description: string;
  referralCallout?: string;
  priority?: 'high' | 'medium' | 'low';
}

export type BusinessPlanIntakeStep =
  | 'planTypeSelection'
  | 'coreDetails'
  | 'fundingFinance'
  | 'operatorExperience'
  | 'professionalServices'
  | 'technologyStack'
  | 'operationalReadiness'
  | 'ownership'
  | 'review';

export interface BusinessPlanData {
  planType?: BusinessPlanType | null;
  intakeStep?: BusinessPlanIntakeStep | null;
  intakeComplete?: boolean;
  brandName?: string | null;
  businessConcept?: string | null;
  businessCategory?: BusinessTypeClassification | null;
  targetMarket?: string | null;
  uniqueSellingPoints?: string | null;
  willServeAlcohol?: boolean | null;
  willHaveGamingOrBetting?: boolean | null;
  liquorLicenceType?: string | null;
  liquorLicenceOtherText?: string | null;
  professionalServices?: ProfessionalServicesData | null;
  technologyStack?: TechnologyStackData | null;
  operationalReadiness?: OperationalReadinessData | null;
  ownership?: OwnershipData | null;
  operatorExperience?: OperatorExperienceData | null;
  opportunities?: BusinessPlanOpportunity[] | null;
  generatedPlanHtml?: string | null;
  generatedAt?: string | null;
  activeScenario?: 'scenario1' | 'scenario2' | 'scenario3';
  hoursVisualizationData?: any;
  hasServiceShifts?: boolean;
}

export type TimeFormatPreference = '12h' | '24h';

export type SalesTargetUnit = 'weekly' | 'monthly' | 'annual';
export type SalesTargetMeaning = 'steady_weekly_target' | 'annual_total_target';

// Menu Builder Types
export interface Ingredient {
  id: string;
  name: string;
}

export interface MenuMajorCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface MenuSubCategory {
  id: string;
  majorCategoryId: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface MenuItemIngredient {
  ingredientId: string;
  cost: number;
}

export interface MenuItem {
  id: string;
  subCategoryId: string;
  name: string;
  description?: string;
  sellingPriceExGST: number;
  ingredients: MenuItemIngredient[];
}

export interface MenuData {
  majorCategories: MenuMajorCategory[];
  subCategories: MenuSubCategory[];
  ingredients: Ingredient[];
  items: MenuItem[];
}

export interface ProjectData {
  projectId?: string;
  projectName?: string;
  period: Period;
  venueType?: VenueType | null;
  storeTown?: string | null;
  expectedOpeningDate?: string | null;
  seasonalityProfile?: SeasonalityProfileName;
  holidayBumpProfile?: HolidayBumpProfileName;
  businessOrigin?: BusinessOrigin | null;
  scenarioMode?: ScenarioMode | null;
  selectedScenario?: 1 | 2 | 3 | null;
  fitoutMode?: FitoutMode | null;
  timeFormatPreference?: TimeFormatPreference;
  salesTargetValue?: number;
  salesTargetUnit?: SalesTargetUnit;
  salesTargetMeaning?: SalesTargetMeaning;
  rampWeeks?: number;
  capAtTarget?: boolean;

  walkthroughStep?: number;
  stepStatus?: Record<number, "complete" | "skipped" | "fail">;
  referralFlags?: Record<string, number>;

  siteName?: string | null;
  siteAddress?: string | null;
  siteListingUrl?: string | null;
  businessWebsiteUrl?: string | null;
  propertyListingParsedData?: PropertyListingParsedData | null;
  businessWebsiteParsedData?: BusinessWebsiteParsedData | null;

  operatingBreakEvenDate?: string | null;
  ownersReturnBreakEvenDate?: string | null;

  simpleBreakEven: {
    enteredSales: number;
    ownersReturn: number;
    rent: number;
    variableCogs: number;
    variableLabour: number;
    variableOther: number;
  };

  detailedBreakEven: {
    scenario1: DetailedBreakEvenScenario;
    scenario2: DetailedBreakEvenScenario;
    scenario3: DetailedBreakEvenScenario;
  };

  fitoutFinancing: {
    scenario1: FitoutFinancingScenario;
    scenario2: FitoutFinancingScenario;
    scenario3: FitoutFinancingScenario;
  };

  hoursOfOperation: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };

  venueOpeningHoursByDay?: {
    monday: VenueDayHours;
    tuesday: VenueDayHours;
    wednesday: VenueDayHours;
    thursday: VenueDayHours;
    friday: VenueDayHours;
    saturday: VenueDayHours;
    sunday: VenueDayHours;
  };

  salesBreakup: {
    weeklySales: number;
    orderTypePercentages?: {
      dineIn: number;
      takeaway: number;
      delivery?: number;
    };
    dayPercentages: {
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
      sunday: number;
    };
    servicePercentages: {
      [key: string]: number;
    };
  };

  labourCosting?: LabourCostingData;

  location?: LocationData;
  locationSuitabilityScore?: number | null;
  orderSources?: OrderSourceBreakdownItem[] | null;

  menuData?: MenuData | null;

  businessPlan?: BusinessPlanData | null;
}
