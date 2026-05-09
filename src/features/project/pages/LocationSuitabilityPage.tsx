import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ProjectData } from '@/lib/types/projectTypes';
import { calculateLocationSuitability } from '@/lib/calculations/locationSuitability';
import { MapPin, Link2, Link2Off, RefreshCw, Sparkles } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { getTownFromPlace, extractSuburbFromAddress } from '@/lib/addressUtils';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';

interface LocationSuitabilityProps {
  project: ProjectData;
  onUpdate: (updates: Partial<ProjectData>) => void;
  isLoaded?: boolean;
  onNavigate?: (route: string) => void;
}

const convertRentToAnnual = (rent: number, period: 'Weekly' | 'Monthly' | 'Yearly'): number => {
  switch (period) {
    case 'Weekly':
      return rent * 52;
    case 'Monthly':
      return rent * 12;
    case 'Yearly':
      return rent;
  }
};

const formatNumber = (value: number): string => {
  return value.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function LocationSuitability({ project, onUpdate, isLoaded = false, onNavigate }: LocationSuitabilityProps) {
  const location = project.location || {};
  const [formData, setFormData] = useState(location);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressTownWarning, setAddressTownWarning] = useState<string | null>(null);

  const breakEvenRent = project.detailedBreakEven?.scenario1?.rent || 0;
  const breakEvenAnnualRent = convertRentToAnnual(breakEvenRent, project.period);
  const hasBreakEvenRent = breakEvenRent > 0;

  const [useManualRent, setUseManualRent] = useState(
    project.location?.useManualRent ?? !hasBreakEvenRent
  );

  useEffect(() => {
    const baseLocation = project.location || {};
    let needsSync = false;
    const syncedLocation = { ...baseLocation };

    if (project.siteAddress && baseLocation.address !== project.siteAddress) {
      syncedLocation.address = project.siteAddress;
      needsSync = true;
    }

    const parsedSize = project.propertyListingParsedData?.premisesSize;
    if (parsedSize && baseLocation.propertySize !== parsedSize) {
      syncedLocation.propertySize = parsedSize;
      needsSync = true;
    }

    if (needsSync) {
      setFormData(syncedLocation);
      onUpdate({ location: syncedLocation });
    } else {
      setFormData(baseLocation);
    }

    if (addressInputRef.current) {
      const addressVal = syncedLocation.address || baseLocation.address || '';
      if (addressInputRef.current.value !== addressVal) {
        addressInputRef.current.value = addressVal;
      }
    }
  }, [project.location, project.siteAddress, project.propertyListingParsedData?.premisesSize]);

  useEffect(() => {
    if (addressInputRef.current && window.google?.maps?.places) {
      const handleFocus = () => {
        setTimeout(() => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer && addressInputRef.current) {
            const inputRect = addressInputRef.current.getBoundingClientRect();
            pacContainer.style.position = 'fixed';
            pacContainer.style.top = `${inputRect.bottom + window.scrollY}px`;
            pacContainer.style.left = `${inputRect.left + window.scrollX}px`;
            pacContainer.style.width = `${inputRect.width}px`;
          }
        }, 0);
      };

      addressInputRef.current.addEventListener('focus', handleFocus);
      addressInputRef.current.addEventListener('input', handleFocus);

      return () => {
        if (addressInputRef.current) {
          addressInputRef.current.removeEventListener('focus', handleFocus);
          addressInputRef.current.removeEventListener('input', handleFocus);
        }
      };
    }
  }, [isLoaded]);

  const parsedData = project.propertyListingParsedData;
  const sizeFromParsed = parsedData?.premisesSize;

  const isAddressSynced = project.siteAddress && formData.address === project.siteAddress;
  const isSizeFromListing = sizeFromParsed && formData.propertySize === sizeFromParsed;

  const handleChange = (field: string, value: string | number | null | boolean) => {
    const updatedLocation = { ...formData, [field]: value };
    setFormData(updatedLocation);

    const updates: Partial<ProjectData> = { location: updatedLocation };

    if (field === 'address' && typeof value === 'string') {
      updates.siteAddress = value || null;

      if (value) {
        const town = extractSuburbFromAddress(value);
        if (town) {
          setAddressTownWarning(null);
          updates.storeTown = town;
        } else {
          setAddressTownWarning(
            "We couldn't detect the town from this address. Town-based forecasting may be less accurate until you confirm it on the Business Planning page."
          );
        }
      }
    }

    if (field === 'propertySize' && typeof value === 'number') {
      const existingParsedData = project.propertyListingParsedData || {
        sourceUrl: 'manual-entry',
        extractedAt: new Date().toISOString(),
        parsingSuccess: true,
      };
      updates.propertyListingParsedData = {
        ...existingParsedData,
        premisesSize: value,
      };
    }

    onUpdate(updates);
  };

  const handleManualRentToggle = (manual: boolean) => {
    setUseManualRent(manual);
    const updatedLocation = {
      ...formData,
      useManualRent: manual,
      annualRent: manual ? formData.annualRent : breakEvenAnnualRent,
    };
    setFormData(updatedLocation);
    onUpdate({ location: updatedLocation });
  };

  useEffect(() => {
    if (!useManualRent && hasBreakEvenRent && formData.annualRent !== breakEvenAnnualRent) {
      const updatedLocation = { ...formData, annualRent: breakEvenAnnualRent };
      setFormData(updatedLocation);
      onUpdate({ location: updatedLocation });
    }
  }, [breakEvenAnnualRent, useManualRent, hasBreakEvenRent]);

  const handlePlaceSelect = async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        handleChange('address', place.formatted_address);

        const town = await getTownFromPlace(place);
        if (town) {
          setAddressTownWarning(null);
          onUpdate({ storeTown: town });
        }
      }
    }
  };

  const breakdown = calculateLocationSuitability(project);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-info';
    if (score >= 40) return 'text-warning-foreground';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const useAutocomplete = isLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 8. Location Suitability</CardTitle>
          <CardDescription>
            Evaluate the potential of your proposed venue location based on key site attributes
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Location Suitability Assessment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="md:col-span-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Label htmlFor="address" className="text-sm font-medium text-muted-foreground">
                  Property Address
                </Label>
                {isAddressSynced && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-info bg-info/10 px-1.5 py-0.5 rounded">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Synced
                  </span>
                )}
              </div>
              <div className="relative">
                {useAutocomplete ? (
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                    }}
                    onPlaceChanged={handlePlaceSelect}
                    options={{
                      componentRestrictions: { country: 'au' },
                      fields: ['formatted_address', 'geometry'],
                    }}
                  >
                    <input
                      ref={addressInputRef}
                      id="address"
                      type="text"
                      placeholder="e.g., 123 Main Street, Sydney"
                      defaultValue={formData.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="text-center flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main Street, Sydney"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="text-center"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              {addressTownWarning && (
                <div className="text-center -mt-3 mb-2">
                  <p className="text-[11px] text-warning-foreground">
                    {addressTownWarning}
                  </p>
                </div>
              )}
              {formData.address && formData.address.trim() !== '' && (
                <div className="text-center -mt-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-info hover:text-info/80 underline hover:no-underline cursor-pointer transition-all duration-150 py-2 px-3 rounded-md hover:bg-info/10 relative z-50"
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'none'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  >
                    <MapPin className="h-3.5 w-3.5 pointer-events-none" />
                    <span className="pointer-events-none">View on Google Maps</span>
                  </a>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Label htmlFor="propertySize" className="text-sm font-medium text-muted-foreground">
                  Floor Area (m²)
                </Label>
                {isSizeFromListing && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-2.5 w-2.5" />
                    From listing
                  </span>
                )}
              </div>
              <Input
                id="propertySize"
                type="number"
                placeholder="e.g., 120"
                value={formData.propertySize || ''}
                onChange={(e) => handleChange('propertySize', e.target.value ? parseFloat(e.target.value) : null)}
                className="text-center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualRent" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Annual Rent ($)
              </Label>
              {hasBreakEvenRent && (
                <div className="flex items-center justify-between p-2 bg-surface-2 rounded-lg border text-xs">
                  <div className="flex items-center gap-2">
                    {useManualRent ? (
                      <Link2Off className="h-4 w-4 text-muted-foreground/60" />
                    ) : (
                      <Link2 className="h-4 w-4 text-info" />
                    )}
                    <span className="text-muted-foreground">
                      {useManualRent ? 'Manual' : 'From Break-Even'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Override</span>
                    <Switch
                      checked={useManualRent}
                      onCheckedChange={handleManualRentToggle}
                    />
                  </div>
                </div>
              )}
              {useManualRent || !hasBreakEvenRent ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm">$</span>
                  <Input
                    id="annualRent"
                    type="number"
                    placeholder="e.g., 65000"
                    value={formData.annualRent || ''}
                    onChange={(e) => handleChange('annualRent', e.target.value ? parseFloat(e.target.value) : null)}
                    className="pl-7 text-center"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="px-3 py-2 bg-info/10 border border-info/30 rounded-md text-foreground font-medium text-sm">
                    ${formatNumber(breakEvenAnnualRent)}
                  </div>
                  <span className="text-xs text-muted-foreground">({project.period} rent x {project.period === 'Weekly' ? '52' : project.period === 'Monthly' ? '12' : '1'})</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="frontageType" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Type of Frontage
              </Label>
              <Select
                value={formData.frontageType || ''}
                onValueChange={(value) => handleChange('frontageType', value)}
              >
                <SelectTrigger id="frontageType" className="text-center">
                  <SelectValue placeholder="Select frontage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MainRoad">Main road</SelectItem>
                  <SelectItem value="SideStreet">Side street</SelectItem>
                  <SelectItem value="ShoppingCentre">Shopping centre</SelectItem>
                  <SelectItem value="NeighbourhoodStrip">Neighbourhood strip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parkingQuality" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Parking Availability
              </Label>
              <Select
                value={formData.parkingQuality || ''}
                onValueChange={(value) => handleChange('parkingQuality', value)}
              >
                <SelectTrigger id="parkingQuality" className="text-center">
                  <SelectValue placeholder="Select parking quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">No parking</SelectItem>
                  <SelectItem value="Street">Street parking only</SelectItem>
                  <SelectItem value="OnsiteLimited">On-site limited</SelectItem>
                  <SelectItem value="OnsiteGood">On-site good</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visibility" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Site Visibility
              </Label>
              <Select
                value={formData.visibility || ''}
                onValueChange={(value) => handleChange('visibility', value)}
              >
                <SelectTrigger id="visibility" className="text-center">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prime">Prime</SelectItem>
                  <SelectItem value="Strong">Strong</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nearbyActivity" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Surrounding Activity
              </Label>
              <Select
                value={formData.nearbyActivity || ''}
                onValueChange={(value) => handleChange('nearbyActivity', value)}
              >
                <SelectTrigger id="nearbyActivity" className="text-center">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Strong">Strong</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="catchmentStrength" className="text-sm font-medium text-muted-foreground mb-2 block text-center">
                Catchment Strength
              </Label>
              <Select
                value={formData.catchmentStrength || ''}
                onValueChange={(value) => handleChange('catchmentStrength', value)}
              >
                <SelectTrigger id="catchmentStrength" className="text-center">
                  <SelectValue placeholder="Select catchment strength" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VeryStrong">Very strong</SelectItem>
                  <SelectItem value="Strong">Strong</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location Suitability Score</CardTitle>
          <CardDescription>
            Based on your inputs, here's how this location scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className={`text-5xl font-bold ${getScoreColor(breakdown.total)}`}>
                {breakdown.total}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="text-lg font-semibold text-foreground mt-2">
                {getScoreLabel(breakdown.total)} Location
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-info/10 rounded-lg border border-info/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Financial Suitability</span>
                  <span className="text-lg font-bold text-info">{breakdown.financial}/25</span>
                </div>
                <div className="w-full bg-info/20 rounded-full h-2">
                  <div
                    className="bg-info h-2 rounded-full transition-all"
                    style={{ width: `${(breakdown.financial / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Demand & Catchment</span>
                  <span className="text-lg font-bold text-success">{breakdown.catchment}/25</span>
                </div>
                <div className="w-full bg-success/20 rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${(breakdown.catchment / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-info/10 rounded-lg border border-info/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Access & Visibility</span>
                  <span className="text-lg font-bold text-info">{breakdown.visibility}/25</span>
                </div>
                <div className="w-full bg-info/20 rounded-full h-2">
                  <div
                    className="bg-info h-2 rounded-full transition-all"
                    style={{ width: `${(breakdown.visibility / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Surrounding Activity</span>
                  <span className="text-lg font-bold text-warning-foreground">{breakdown.activity}/25</span>
                </div>
                <div className="w-full bg-warning/20 rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full transition-all"
                    style={{ width: `${(breakdown.activity / 25) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-2">What this means:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {breakdown.total >= 80 && (
                  <>
                    <li>• This location shows excellent potential for your business</li>
                    <li>• All key factors are well-aligned with success criteria</li>
                    <li>• Proceed with confidence to detailed break-even analysis</li>
                  </>
                )}
                {breakdown.total >= 60 && breakdown.total < 80 && (
                  <>
                    <li>• This location has good potential with some areas to watch</li>
                    <li>• Review your break-even carefully and ensure rent is manageable</li>
                    <li>• Consider negotiating terms to strengthen your position</li>
                  </>
                )}
                {breakdown.total >= 40 && breakdown.total < 60 && (
                  <>
                    <li>• This location is workable but has some limitations</li>
                    <li>• Pay close attention to rent affordability and break-even</li>
                    <li>• Strong marketing may be needed to overcome location challenges</li>
                  </>
                )}
                {breakdown.total < 40 && (
                  <>
                    <li>• This location shows significant challenges</li>
                    <li>• Consider alternative premises or negotiate rent heavily</li>
                    <li>• Success will require exceptional execution and lower costs</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.LOCATION_SUITABILITY}
          onNavigate={onNavigate}
          onUpdate={onUpdate}
          showPrevious={true}
        />
      )}
    </div>
  );
}
