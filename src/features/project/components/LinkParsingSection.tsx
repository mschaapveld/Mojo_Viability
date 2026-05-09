import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Autocomplete } from '@react-google-maps/api';
import { getTownFromPlace } from '@/lib/addressUtils';
import {
  Link2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShoppingCart,
  Calendar,
  FileText,
  Sparkles,
  Edit3,
  Upload,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import {
  ProjectData,
  PropertyListingParsedData,
  BusinessWebsiteParsedData,
  MojoOpportunity,
  PropertyDataSource
} from '@/lib/types/projectTypes';

interface LinkParsingSectionProps {
  project: ProjectData;
  onChange: (patch: Partial<ProjectData>) => void;
  origin: 'new' | 'existing';
  isGoogleMapsLoaded?: boolean;
  onManualEntryStateChange?: (isInManualEntry: boolean) => void;
}

type ParsingStatus = 'idle' | 'parsing' | 'success' | 'error';

interface ManualEntryData {
  address: string;
  premisesSize: string;
  rentAmount: string;
  rentPeriod: 'weekly' | 'monthly' | 'annual' | '';
  notes: string;
}

interface ReviewData {
  address: string;
  premisesSize: string;
  rentAmount: string;
  rentPeriod: 'weekly' | 'monthly' | 'annual' | '';
  notes: string;
}

const convertRentToPeriod = (amount: number, fromPeriod: string, toPeriod: 'Weekly' | 'Monthly' | 'Yearly'): number => {
  let annual = amount;
  switch (fromPeriod?.toLowerCase()) {
    case 'weekly':
      annual = amount * 52;
      break;
    case 'monthly':
      annual = amount * 12;
      break;
    case 'annual':
    case 'yearly':
      annual = amount;
      break;
  }

  switch (toPeriod) {
    case 'Weekly':
      return Math.round(annual / 52);
    case 'Monthly':
      return Math.round(annual / 12);
    case 'Yearly':
      return annual;
  }
};

export function LinkParsingSection({ project, onChange, origin, isGoogleMapsLoaded = false, onManualEntryStateChange }: LinkParsingSectionProps) {
  const [propertyUrl, setPropertyUrl] = useState(project.siteListingUrl || '');
  const [businessUrl, setBusinessUrl] = useState(project.businessWebsiteUrl || '');
  const [propertyParsingStatus, setPropertyParsingStatus] = useState<ParsingStatus>('idle');
  const [businessParsingStatus, setBusinessParsingStatus] = useState<ParsingStatus>('idle');
  const [showManualEntry, setShowManualEntryInternal] = useState(false);

  const setShowManualEntry = (value: boolean) => {
    setShowManualEntryInternal(value);
    onManualEntryStateChange?.(value);
  };
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [dataApplied, setDataApplied] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [dataSourceType, setDataSourceType] = useState<PropertyDataSource>('parsed');
  const [isDynamicContent, setIsDynamicContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingParsedData = project.propertyListingParsedData;
  const [manualData, setManualData] = useState<ManualEntryData>({
    address: existingParsedData?.address || project.siteAddress || '',
    premisesSize: existingParsedData?.premisesSize?.toString() || '',
    rentAmount: existingParsedData?.rentAmount?.toString() || '',
    rentPeriod: (existingParsedData?.rentPeriod as ManualEntryData['rentPeriod']) || '',
    notes: existingParsedData?.inclusions || '',
  });

  const [reviewData, setReviewData] = useState<ReviewData>({
    address: '',
    premisesSize: '',
    rentAmount: '',
    rentPeriod: '',
    notes: '',
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const useAutocomplete = isGoogleMapsLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const newAddress = project.siteAddress || project.propertyListingParsedData?.address || '';
    if (newAddress && newAddress !== manualData.address) {
      setManualData(prev => ({ ...prev, address: newAddress }));
    }
  }, [project.siteAddress]);

  useEffect(() => {
    const parsed = project.propertyListingParsedData;
    if (parsed) {
      setManualData(prev => ({
        ...prev,
        address: parsed.address || prev.address || project.siteAddress || '',
        premisesSize: parsed.premisesSize?.toString() || prev.premisesSize,
        rentAmount: parsed.rentAmount?.toString() || prev.rentAmount,
        rentPeriod: (parsed.rentPeriod as ManualEntryData['rentPeriod']) || prev.rentPeriod,
        notes: parsed.inclusions || prev.notes,
      }));
    }
  }, [project.propertyListingParsedData]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const parsePropertyUrl = async (url: string) => {
    if (!isValidUrl(url)) return;

    setPropertyParsingStatus('parsing');
    setDataApplied(false);
    setApplySuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url, type: 'property' }),
        }
      );

      const result = await response.json();
      if (result.data) {
        const parsedData = result.data as PropertyListingParsedData;
        onChange({
          siteListingUrl: url,
          propertyListingParsedData: parsedData,
        });
        setPropertyParsingStatus(parsedData.parsingSuccess ? 'success' : 'error');

        if (parsedData.parsingSuccess) {
          setReviewData({
            address: parsedData.address || '',
            premisesSize: parsedData.premisesSize?.toString() || '',
            rentAmount: parsedData.rentAmount?.toString() || '',
            rentPeriod: (parsedData.rentPeriod as ReviewData['rentPeriod']) || '',
            notes: parsedData.inclusions || '',
          });
          setIsManualEntry(false);
          setDataSourceType('parsed');
          setIsDynamicContent(false);
          setShowReviewPanel(true);
        } else {
          const isDynamic = parsedData.parsingErrorType === 'dynamic_content';
          setIsDynamicContent(isDynamic);
          setDataSourceType('manual');
          setShowManualEntry(true);
        }
      } else {
        setPropertyParsingStatus('error');
        setDataSourceType('manual');
        setShowManualEntry(true);
      }
    } catch {
      setPropertyParsingStatus('error');
      setDataSourceType('manual');
      setShowManualEntry(true);
      onChange({
        siteListingUrl: url,
        propertyListingParsedData: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          parsingSuccess: false,
          parsingError: 'We could not access this listing. You can enter the details manually below.',
          parsingErrorType: 'fetch_failed',
        },
      });
    }
  };

  const parseBusinessUrl = async (url: string) => {
    if (!isValidUrl(url)) return;

    setBusinessParsingStatus('parsing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url, type: 'business' }),
        }
      );

      const result = await response.json();
      if (result.data) {
        onChange({
          businessWebsiteUrl: url,
          businessWebsiteParsedData: result.data as BusinessWebsiteParsedData,
        });
        setBusinessParsingStatus(result.data.parsingSuccess ? 'success' : 'error');
      } else {
        setBusinessParsingStatus('error');
      }
    } catch {
      setBusinessParsingStatus('error');
      onChange({
        businessWebsiteUrl: url,
        businessWebsiteParsedData: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          parsingSuccess: false,
          parsingError: 'Failed to connect to parsing service',
        },
      });
    }
  };

  const handlePropertyUrlChange = (url: string) => {
    setPropertyUrl(url);
    onChange({ siteListingUrl: url || null });
    if (isValidUrl(url)) {
      parsePropertyUrl(url);
    }
  };

  const handleBusinessUrlChange = (url: string) => {
    setBusinessUrl(url);
    onChange({ businessWebsiteUrl: url || null });
    if (isValidUrl(url)) {
      parseBusinessUrl(url);
    }
  };

  const handleApplyPropertyDetails = () => {
    if (project.scenarioMode === 'multi') {
      const addresses = [
        project.siteAddress,
        project.propertyListingParsedData?.address,
      ].filter(Boolean);
      const uniqueAddresses = [...new Set(addresses)];
      if (uniqueAddresses.length > 1 && reviewData.address !== project.siteAddress) {
        return;
      }
    }

    const updates: Partial<ProjectData> = {};
    const appliedFields: string[] = [];

    if (reviewData.address) {
      updates.siteAddress = reviewData.address;
      updates.location = {
        ...project.location,
        address: reviewData.address,
      };
      appliedFields.push('address');
    }

    if (reviewData.premisesSize) {
      const size = parseFloat(reviewData.premisesSize);
      updates.location = {
        ...updates.location,
        ...project.location,
        propertySize: size,
      };
      appliedFields.push('floor area');
    }

    if (reviewData.rentAmount && reviewData.rentPeriod) {
      const rentAmount = parseFloat(reviewData.rentAmount);
      const convertedRent = convertRentToPeriod(rentAmount, reviewData.rentPeriod, project.period);

      updates.detailedBreakEven = {
        ...project.detailedBreakEven,
        scenario1: {
          ...project.detailedBreakEven.scenario1,
          rent: convertedRent,
        },
        scenario2: {
          ...project.detailedBreakEven.scenario2,
          rent: project.scenarioMode === 'multi' ? convertedRent : project.detailedBreakEven.scenario2.rent,
        },
        scenario3: {
          ...project.detailedBreakEven.scenario3,
          rent: project.scenarioMode === 'multi' ? convertedRent : project.detailedBreakEven.scenario3.rent,
        },
      };

      let annualRent = rentAmount;
      if (reviewData.rentPeriod === 'weekly') annualRent = rentAmount * 52;
      if (reviewData.rentPeriod === 'monthly') annualRent = rentAmount * 12;

      updates.location = {
        ...updates.location,
        ...project.location,
        annualRent: annualRent,
        useManualRent: false,
      };
      appliedFields.push('rent');
    }

    const parsedData: PropertyListingParsedData = {
      sourceUrl: propertyUrl || 'manual-entry',
      extractedAt: new Date().toISOString(),
      parsingSuccess: true,
      address: reviewData.address || null,
      premisesSize: reviewData.premisesSize ? parseFloat(reviewData.premisesSize) : null,
      rentAmount: reviewData.rentAmount ? parseFloat(reviewData.rentAmount) : null,
      rentPeriod: reviewData.rentPeriod || null,
      inclusions: reviewData.notes || null,
      dataSource: dataSourceType,
    };
    updates.propertyListingParsedData = parsedData;

    onChange(updates);
    setDataApplied(true);
    setApplySuccess(true);
    setShowReviewPanel(false);

    setTimeout(() => setApplySuccess(false), 3000);
  };

  const handleApplyAddress = (address: string, town?: string) => {
    if (project.scenarioMode === 'multi') {
      const addresses = [
        project.siteAddress,
        project.propertyListingParsedData?.address,
        project.businessWebsiteParsedData?.businessAddress,
      ].filter(Boolean);
      const uniqueAddresses = [...new Set(addresses)];
      if (uniqueAddresses.length > 1) {
        return;
      }
    }
    onChange({
      siteAddress: address,
      storeTown: town || project.storeTown,
      location: { ...project.location, address },
    });
  };

  const handlePlaceChanged = async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        const town = await getTownFromPlace(place);
        setManualData(prev => ({ ...prev, address: place.formatted_address || '' }));

        onChange({
          siteAddress: place.formatted_address,
          storeTown: town || project.storeTown,
        });
      }
    }
  };

  const handleManualAddressChange = (value: string) => {
    setManualData(prev => ({ ...prev, address: value }));
    onChange({
      siteAddress: value || null,
    });
  };

  const handleDirectApplyManualEntry = () => {
    const updates: Partial<ProjectData> = {};

    if (manualData.address) {
      updates.siteAddress = manualData.address;
      updates.location = {
        ...project.location,
        address: manualData.address,
      };
    }

    if (manualData.premisesSize) {
      const size = parseFloat(manualData.premisesSize);
      updates.location = {
        ...updates.location,
        ...project.location,
        propertySize: size,
      };
    }

    if (manualData.rentAmount && manualData.rentPeriod) {
      const rentAmount = parseFloat(manualData.rentAmount);
      const convertedRent = convertRentToPeriod(rentAmount, manualData.rentPeriod, project.period);

      updates.detailedBreakEven = {
        ...project.detailedBreakEven,
        scenario1: {
          ...project.detailedBreakEven.scenario1,
          rent: convertedRent,
        },
        scenario2: {
          ...project.detailedBreakEven.scenario2,
          rent: project.scenarioMode === 'multi' ? convertedRent : project.detailedBreakEven.scenario2.rent,
        },
        scenario3: {
          ...project.detailedBreakEven.scenario3,
          rent: project.scenarioMode === 'multi' ? convertedRent : project.detailedBreakEven.scenario3.rent,
        },
      };

      let annualRent = rentAmount;
      if (manualData.rentPeriod === 'weekly') annualRent = rentAmount * 52;
      if (manualData.rentPeriod === 'monthly') annualRent = rentAmount * 12;

      updates.location = {
        ...updates.location,
        ...project.location,
        annualRent: annualRent,
        useManualRent: false,
      };
    }

    const parsedData: PropertyListingParsedData = {
      sourceUrl: propertyUrl || 'manual-entry',
      extractedAt: new Date().toISOString(),
      parsingSuccess: true,
      address: manualData.address || null,
      premisesSize: manualData.premisesSize ? parseFloat(manualData.premisesSize) : null,
      rentAmount: manualData.rentAmount ? parseFloat(manualData.rentAmount) : null,
      rentPeriod: manualData.rentPeriod || null,
      inclusions: manualData.notes || null,
      dataSource: dataSourceType,
    };
    updates.propertyListingParsedData = parsedData;

    onChange(updates);
    setDataApplied(true);
    setShowManualEntry(false);
    setPropertyParsingStatus('idle');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDataSourceType('uploaded');
    setShowManualEntry(true);
  };


  const propertyData = project.propertyListingParsedData;
  const businessData = project.businessWebsiteParsedData;

  const hasExtractedData = reviewData.address || reviewData.premisesSize || reviewData.rentAmount;
  const missingFields: string[] = [];
  if (!reviewData.address) missingFields.push('address');
  if (!reviewData.premisesSize) missingFields.push('floor area');
  if (!reviewData.rentAmount) missingFields.push('rent');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="property-listing" className="text-sm font-medium text-slate-700">
            Property Listing Link (optional)
          </Label>
          <div className="relative">
            <Input
              id="property-listing"
              type="url"
              value={propertyUrl}
              placeholder="Paste link to the property advertisement"
              onChange={(e) => handlePropertyUrlChange(e.target.value)}
              className="pr-10 bg-white"
            />
            {propertyParsingStatus === 'parsing' && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
            )}
            {propertyParsingStatus === 'success' && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {propertyParsingStatus === 'error' && (
              <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
            )}
          </div>
          {propertyParsingStatus === 'error' && propertyUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => parsePropertyUrl(propertyUrl)}
              className="text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>

        {origin === 'existing' && (
          <div className="space-y-2">
            <Label htmlFor="business-website" className="text-sm font-medium text-slate-700">
              Business Website Link (optional)
            </Label>
            <div className="relative">
              <Input
                id="business-website"
                type="url"
                value={businessUrl}
                placeholder="Paste link to the business website"
                onChange={(e) => handleBusinessUrlChange(e.target.value)}
                className="pr-10 bg-white"
              />
              {businessParsingStatus === 'parsing' && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
              {businessParsingStatus === 'success' && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {businessParsingStatus === 'error' && (
                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              )}
            </div>
            {businessParsingStatus === 'error' && businessUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => parseBusinessUrl(businessUrl)}
                className="text-xs h-7"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {applySuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            Property details applied. Occupancy costs and location have been updated.
          </AlertDescription>
        </Alert>
      )}

      {showReviewPanel && hasExtractedData && (
        <Card className={isManualEntry ? "border-slate-200 bg-slate-50" : "border-blue-200 bg-blue-50"}>
          {!isManualEntry && (
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Review Property Details
              </CardTitle>
              <p className="text-xs text-blue-600 mt-1">
                We've extracted these details. Review and edit as needed, then confirm to pre-fill your plan.
              </p>
            </CardHeader>
          )}
          {isManualEntry && propertyParsingStatus === 'error' && (
            <CardHeader className="pb-2">
              <Alert className="border-amber-200 bg-amber-50 mb-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  We couldn't extract details from this link. Please enter the information manually below.
                </AlertDescription>
              </Alert>
            </CardHeader>
          )}
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className={`text-xs ${isManualEntry ? 'text-slate-700' : 'text-blue-700'}`}>Address</Label>
                <Input
                  value={reviewData.address}
                  onChange={(e) => setReviewData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Property address"
                  className="mt-1 text-sm h-8 bg-white"
                />
              </div>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-1">
                  <Label className={`text-xs ${isManualEntry ? 'text-slate-700' : 'text-blue-700'}`}>Floor Area (sqm)</Label>
                  <Input
                    type="number"
                    value={reviewData.premisesSize}
                    onChange={(e) => setReviewData(prev => ({ ...prev, premisesSize: e.target.value }))}
                    placeholder="e.g., 120"
                    className="mt-1 text-sm h-8 bg-white"
                  />
                </div>
                <div className="col-span-2.5">
                  <Label className={`text-xs ${isManualEntry ? 'text-slate-700' : 'text-blue-700'}`}>Rent Amount ($)</Label>
                  <Input
                    type="number"
                    value={reviewData.rentAmount}
                    onChange={(e) => setReviewData(prev => ({ ...prev, rentAmount: e.target.value }))}
                    placeholder="e.g., 50000"
                    className="mt-1 text-sm h-8 bg-white"
                  />
                </div>
                <div className="col-span-2.5">
                  <Label className={`text-xs ${isManualEntry ? 'text-slate-700' : 'text-blue-700'}`}>Period</Label>
                  <select
                    className="mt-1 w-full h-8 text-sm rounded-md border border-input bg-white px-2"
                    value={reviewData.rentPeriod}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      rentPeriod: e.target.value as ReviewData['rentPeriod']
                    }))}
                  >
                    <option value="">Select...</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
            </div>

            {missingFields.length > 0 && (
              <p className="text-xs text-amber-600">
                Note: {missingFields.join(', ')} could not be extracted. You can enter {missingFields.length === 1 ? 'it' : 'them'} above.
              </p>
            )}

            {project.scenarioMode === 'multi' && (
              <p className="text-xs text-slate-500">
                In multi-scenario mode, these details will be applied to all scenarios using the same property.
              </p>
            )}

            <div className={`flex gap-2 pt-2 ${isManualEntry ? 'border-t border-slate-200' : 'border-t border-blue-200'}`}>
              <Button
                size="sm"
                onClick={handleApplyPropertyDetails}
                className="text-xs bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Use these property details
              </Button>
              {!isManualEntry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReviewPanel(false)}
                  className="text-xs bg-white"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {dataApplied && propertyData && propertyData.parsingSuccess && !showReviewPanel && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Property Details Applied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {propertyData.address && (
                <div>
                  <span className="text-slate-500 text-xs block">Address</span>
                  <span className="font-medium text-slate-800">{propertyData.address}</span>
                </div>
              )}
              {propertyData.premisesSize && (
                <div>
                  <span className="text-slate-500 text-xs block">Size</span>
                  <span className="font-medium text-slate-800">{propertyData.premisesSize} sqm</span>
                </div>
              )}
              {propertyData.rentAmount && (
                <div>
                  <span className="text-slate-500 text-xs block">Rent</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(propertyData.rentAmount)} {propertyData.rentPeriod || 'p.a.'}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-green-200">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReviewData({
                    address: propertyData.address || '',
                    premisesSize: propertyData.premisesSize?.toString() || '',
                    rentAmount: propertyData.rentAmount?.toString() || '',
                    rentPeriod: (propertyData.rentPeriod as ReviewData['rentPeriod']) || '',
                    notes: propertyData.inclusions || '',
                  });
                  setShowReviewPanel(true);
                }}
                className="text-xs bg-white"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit and re-apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {businessData && businessData.parsingSuccess && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Business Details Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {businessData.businessName && (
                <div>
                  <span className="text-slate-500 text-xs block">Business Name</span>
                  <span className="font-medium text-slate-800">{businessData.businessName}</span>
                </div>
              )}
              {businessData.businessType && (
                <div>
                  <span className="text-slate-500 text-xs block">Type</span>
                  <Badge variant="outline" className="text-xs">{businessData.businessType}</Badge>
                </div>
              )}
              {businessData.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800 text-xs">{businessData.phone}</span>
                </div>
              )}
              {businessData.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800 text-xs truncate">{businessData.email}</span>
                </div>
              )}
              {businessData.businessAddress && (
                <div className="col-span-2">
                  <span className="text-slate-500 text-xs block">Address</span>
                  <span className="font-medium text-slate-800">{businessData.businessAddress}</span>
                </div>
              )}
            </div>

            <Separator className="bg-blue-200" />

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className={`h-3.5 w-3.5 ${businessData.hasOnsiteOrdering ? 'text-green-600' : 'text-slate-400'}`} />
                <span className={businessData.hasOnsiteOrdering ? 'text-green-700' : 'text-slate-500'}>
                  {businessData.hasOnsiteOrdering ? 'Direct ordering' : 'No direct ordering'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className={`h-3.5 w-3.5 ${businessData.hasThirdPartyOrdering ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={businessData.hasThirdPartyOrdering ? 'text-amber-700' : 'text-slate-500'}>
                  {businessData.hasThirdPartyOrdering
                    ? businessData.detectedAggregators?.join(', ')
                    : 'No aggregators'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className={`h-3.5 w-3.5 ${businessData.hasBookingSystem ? 'text-green-600' : 'text-slate-400'}`} />
                <span className={businessData.hasBookingSystem ? 'text-green-700' : 'text-slate-500'}>
                  {businessData.hasBookingSystem
                    ? businessData.detectedBookingProvider || 'Bookings'
                    : 'No bookings'}
                </span>
              </div>
            </div>

            {businessData.businessAddress && (
              <div className="pt-2 border-t border-blue-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyAddress(businessData.businessAddress!)}
                  className="text-xs bg-white"
                  disabled={project.siteAddress === businessData.businessAddress}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {project.siteAddress === businessData.businessAddress ? 'Address Applied' : 'This is the correct address'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {businessData?.mojoOpportunities && businessData.mojoOpportunities.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Mojo Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {businessData.mojoOpportunities.map((opp: MojoOpportunity, idx: number) => (
                <div key={idx} className="text-xs">
                  <p className="text-slate-700">{opp.description}</p>
                  {opp.referralCallout && (
                    <p className="text-amber-700 font-medium mt-0.5">{opp.referralCallout}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {showManualEntry && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            {propertyParsingStatus === 'error' && propertyUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {isDynamicContent
                        ? 'This listing uses dynamic content'
                        : 'Property details not found'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isDynamicContent
                        ? "Some property websites load content dynamically, which we can't reliably extract. You can copy the details directly from the listing."
                        : "We couldn't find the key details on this page. You can enter them manually below."}
                    </p>
                    {propertyUrl && (
                      <a
                        href={propertyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open listing in new tab
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            <CardTitle className="text-sm font-medium text-slate-800">
              Enter Property Details
            </CardTitle>
            <p className="text-xs text-slate-500">
              You can copy these details directly from the listing.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Address</Label>
              {useAutocomplete ? (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={handlePlaceChanged}
                  options={{
                    componentRestrictions: { country: 'au' },
                    fields: ['formatted_address', 'address_components', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    value={manualData.address}
                    onChange={(e) => handleManualAddressChange(e.target.value)}
                    placeholder="Start typing address..."
                    className="flex h-8 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </Autocomplete>
              ) : (
                <Input
                  value={manualData.address}
                  onChange={(e) => handleManualAddressChange(e.target.value)}
                  placeholder="e.g., 123 Main St, Sydney NSW 2000"
                  className="text-sm h-8"
                />
              )}
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-1">
                <Label className="text-xs">Floor Area (m²)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 120"
                  value={manualData.premisesSize}
                  onChange={(e) => setManualData(prev => ({ ...prev, premisesSize: e.target.value }))}
                  className="mt-1 text-sm h-8"
                />
              </div>
              <div className="col-span-2.5">
                <Label className="text-xs">Rent Amount ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={manualData.rentAmount}
                  onChange={(e) => setManualData(prev => ({ ...prev, rentAmount: e.target.value }))}
                  className="mt-1 text-sm h-8"
                />
              </div>
              <div className="col-span-2.5">
                <Label className="text-xs">Rent Period</Label>
                <select
                  className="mt-1 w-full h-8 text-sm rounded-md border border-input bg-white px-3"
                  value={manualData.rentPeriod}
                  onChange={(e) => setManualData(prev => ({
                    ...prev,
                    rentPeriod: e.target.value as ManualEntryData['rentPeriod']
                  }))}
                >
                  <option value="">Select...</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes (e.g. lease terms, incentives, fitout)</Label>
              <Input
                placeholder="Any additional notes about the property"
                value={manualData.notes}
                onChange={(e) => setManualData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 text-sm h-8"
              />
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-600">Have a brochure or PDF?</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Upload a listing brochure and enter the details from it.
              </p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-7"
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload brochure (optional)
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleDirectApplyManualEntry}
                className="text-xs bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Use these property details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManualEntry(false)}
                className="text-xs"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showManualEntry && !propertyUrl && !showReviewPanel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManualEntry(true)}
          className="text-xs h-7 text-slate-600"
        >
          <FileText className="h-3 w-3 mr-1" />
          Or enter property details manually
        </Button>
      )}

      <p className="text-[10px] text-slate-500">
        We'll try to extract key details like rent, area, and description from your links.
      </p>
    </div>
  );
}
