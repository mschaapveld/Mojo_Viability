import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Copy, Trash2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { parseTimeInput, formatTime, parseDecimalHours, formatDecimalHours, calculateHoursBetween, TimeFormat } from '@/lib/timeUtils';
import { parseGlobalSchedule } from '@/lib/naturalLanguageParser';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ProjectData, VenueDayHours, VenueOpeningWindow } from '@/lib/types/projectTypes';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';
import { HoursScheduleChart } from '@/components/shared/HoursScheduleChart';
import { transformWeeklyScheduleToVisualizationData, WeeklySchedule } from '@/lib/hoursVisualization';
import { VenueOpeningHours } from '@/features/project/components/VenueOpeningHours';

interface Shift {
  id: string;
  serviceName: string;
  openTime: string;
  closeTime: string;
  prepHours: number;
  shutdownHours: number;
}

interface DayData {
  isOpen: boolean;
  shifts: Shift[];
}

interface WeeklyData {
  [key: string]: DayData;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SERVICE_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Happy Hour', 'Late Night'];

const DEFAULT_SHIFT: Omit<Shift, 'id'> = {
  serviceName: 'Breakfast',
  openTime: '',
  closeTime: '',
  prepHours: 0,
  shutdownHours: 0,
};

const DEFAULT_DAY: DayData = {
  isOpen: true,
  shifts: [],
};

interface HoursOfOperationProps {
  data: any;
  onUpdate: (data: any) => void;
  project?: ProjectData;
  onNavigate?: (route: string) => void;
}

export function HoursOfOperation({ project, onNavigate }: HoursOfOperationProps) {
  const [wizardStep, setWizardStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<'manual' | 'natural_language' | null>(null);
  const [businessType, setBusinessType] = useState<'hospitality' | 'other'>('hospitality');
  const [mode, setMode] = useState<'service_shifts' | 'simple_hours'>('simple_hours');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(project?.timeFormatPreference || '12h');
  const [naturalLanguageText, setNaturalLanguageText] = useState('');
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(() => {
    const initial: WeeklyData = {};
    DAYS.forEach(day => {
      initial[day] = {
        ...DEFAULT_DAY,
        shifts: [{ id: crypto.randomUUID(), ...DEFAULT_SHIFT }]
      };
    });
    return initial;
  });
  const [venueOpeningHours, setVenueOpeningHours] = useState<{
    monday: VenueDayHours;
    tuesday: VenueDayHours;
    wednesday: VenueDayHours;
    thursday: VenueDayHours;
    friday: VenueDayHours;
    saturday: VenueDayHours;
    sunday: VenueDayHours;
  }>(() => {
    const initial: Record<string, VenueDayHours> = {};
    DAYS.forEach(day => {
      initial[day] = { isOpen: false, windows: [] };
    });
    return initial as any;
  });
  const [loading, setLoading] = useState(true);
  const [serviceShiftsEnabled, setServiceShiftsEnabled] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'simple' | 'detailed'>('simple');
  const hasLoadedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadData();
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!loading && wizardStep === 4) {
      const timeoutId = setTimeout(() => {
        saveData();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [weeklyData, venueOpeningHours, businessType, mode, timeFormat, loading, wizardStep]);

  // Sync weeklyData day open/closed state with venueOpeningHours
  useEffect(() => {
    if (!loading) {
      const needsSync = DAYS.some(day => {
        const venueIsOpen = venueOpeningHours[day as keyof typeof venueOpeningHours]?.isOpen ?? false;
        return weeklyData[day]?.isOpen !== venueIsOpen;
      });

      if (needsSync) {
        setWeeklyData(prev => {
          const updated = { ...prev };
          DAYS.forEach(day => {
            const venueIsOpen = venueOpeningHours[day as keyof typeof venueOpeningHours]?.isOpen ?? false;
            if (updated[day]) {
              updated[day] = { ...updated[day], isOpen: venueIsOpen };
            }
          });
          return updated;
        });
      }
    }
  }, [venueOpeningHours, loading]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: hoursData, error } = await supabase
        .from('hours_of_operation')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (hoursData && hoursData.weekly_data && Object.keys(hoursData.weekly_data).length > 0) {
        // Set all state in a batch to avoid intermediate renders
        setBusinessType(hoursData.business_type);
        setMode(hoursData.mode);
        // Load time format from project if available, otherwise from hours data for backward compatibility
        if (project?.timeFormatPreference) {
          setTimeFormat(project.timeFormatPreference);
        } else if (hoursData.time_format) {
          const legacyFormat = hoursData.time_format === '12hr' ? '12h' : '24h';
          setTimeFormat(legacyFormat);
        }
        setWeeklyData(hoursData.weekly_data);

        // Load service shifts enabled state from database or infer from data
        if (typeof hoursData.service_shifts_enabled === 'boolean') {
          setServiceShiftsEnabled(hoursData.service_shifts_enabled);
        } else {
          // Backward compatibility: Check if any shifts have valid data
          const hasValidShifts = Object.values(hoursData.weekly_data).some((dayData: any) =>
            dayData.shifts?.some((shift: any) => shift.openTime && shift.closeTime)
          );
          setServiceShiftsEnabled(hasValidShifts);
        }

        // Load venue opening hours or migrate from legacy data
        if (hoursData.venue_opening_hours) {
          // Check if it's the new format with isOpen and windows
          const firstDay = hoursData.venue_opening_hours.monday;
          if (firstDay && typeof firstDay === 'object' && 'isOpen' in firstDay && 'windows' in firstDay) {
            // New format
            setVenueOpeningHours(hoursData.venue_opening_hours);
          } else {
            // Old format (just arrays of windows) - migrate to new format
            const migratedHours: Record<string, VenueDayHours> = {};
            DAYS.forEach(day => {
              const windows = (hoursData.venue_opening_hours as any)[day] || [];
              migratedHours[day] = {
                isOpen: windows.length > 0,
                windows: windows,
              };
            });
            setVenueOpeningHours(migratedHours as any);
          }
        } else {
          // Backward compatibility: migrate from legacy single venueOpenTime/venueCloseTime
          const migratedHours: Record<string, VenueDayHours> = {};
          DAYS.forEach(day => {
            const dayData = hoursData.weekly_data[day];
            if (dayData?.venueOpenTime && dayData?.venueCloseTime) {
              migratedHours[day] = {
                isOpen: true,
                windows: [{
                  id: crypto.randomUUID(),
                  openTime: dayData.venueOpenTime,
                  closeTime: dayData.venueCloseTime,
                }],
              };
            } else {
              migratedHours[day] = {
                isOpen: false,
                windows: [],
              };
            }
          });
          setVenueOpeningHours(migratedHours as any);
        }

        setInputMethod('manual');
        // Set wizard step last and only after loading is done
        setTimeout(() => {
          setWizardStep(4);
          setLoading(false);
        }, 0);
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading hours data:', error);
      setLoading(false);
    }
  };

  const saveData = async (showSuccessToast = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data: existing } = await supabase
        .from('hours_of_operation')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('hours_of_operation')
          .update({
            business_type: businessType,
            mode,
            time_format: timeFormat,
            weekly_data: weeklyData,
            venue_opening_hours: venueOpeningHours,
            service_shifts_enabled: serviceShiftsEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hours_of_operation')
          .insert({
            user_id: user.id,
            business_type: businessType,
            mode,
            time_format: timeFormat,
            weekly_data: weeklyData,
            venue_opening_hours: venueOpeningHours,
            service_shifts_enabled: serviceShiftsEnabled,
          });

        if (error) throw error;
      }

      if (showSuccessToast) {
        toast({
          title: 'Saved',
          description: 'Hours of operation saved successfully',
        });
      }
    } catch (error) {
      console.error('Error saving hours data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hours of operation',
        variant: 'destructive',
      });
    }
  };

  const updateTimeFormatPreference = async (newFormat: TimeFormat) => {
    setTimeFormat(newFormat);

    if (!project?.projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ time_format_preference: newFormat })
        .eq('id', project.projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating time format preference:', error);
      setTimeFormat(project.timeFormatPreference || '12h');
      toast({
        title: 'Error',
        description: 'Failed to update time format preference',
        variant: 'destructive',
      });
    }
  };

  const addShift = (day: string) => {
    setWeeklyData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: [
          ...prev[day].shifts,
          {
            id: crypto.randomUUID(),
            ...DEFAULT_SHIFT,
          },
        ],
      },
    }));
  };

  const removeShift = (day: string, shiftId: string) => {
    setWeeklyData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: prev[day].shifts.filter(s => s.id !== shiftId),
      },
    }));
  };

  const updateShift = (day: string, shiftId: string, updates: Partial<Shift>) => {
    setWeeklyData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        shifts: prev[day].shifts.map(s =>
          s.id === shiftId ? { ...s, ...updates } : s
        ),
      },
    }));
  };



  const applyNaturalLanguageSchedule = () => {
    const result = parseGlobalSchedule(naturalLanguageText);
    const newWeeklyData: WeeklyData = { ...weeklyData };
    const newVenueOpeningHours = { ...venueOpeningHours };

    result.venueHours.forEach(({ days, open, close }) => {
      days.forEach(day => {
        if (newVenueOpeningHours[day as keyof typeof newVenueOpeningHours]) {
          (newVenueOpeningHours as any)[day] = {
            isOpen: true,
            windows: [{
              id: crypto.randomUUID(),
              openTime: open,
              closeTime: close,
            }],
          };
          if (newWeeklyData[day]) {
            newWeeklyData[day].isOpen = true;
          }
        }
      });
    });

    result.shifts.forEach(({ days, service, open, close, prep, shutdown }) => {
      days.forEach(day => {
        if (newWeeklyData[day] && newWeeklyData[day].isOpen) {
          const existingShiftIndex = newWeeklyData[day].shifts.findIndex(s => s.serviceName === service);
          const newShift: Shift = {
            id: crypto.randomUUID(),
            serviceName: service,
            openTime: open,
            closeTime: close,
            prepHours: prep,
            shutdownHours: shutdown,
          };

          if (existingShiftIndex >= 0) {
            newWeeklyData[day].shifts[existingShiftIndex] = newShift;
          } else {
            if (newWeeklyData[day].shifts.length === 1 && !newWeeklyData[day].shifts[0].openTime) {
              newWeeklyData[day].shifts = [newShift];
            } else {
              newWeeklyData[day].shifts.push(newShift);
            }
          }
        }
      });
    });

    // Calculate venue hours from shifts if no explicit venue hours were provided
    if (result.venueHours.length === 0 && result.shifts.length > 0) {
      DAYS.forEach(day => {
        const dayShifts = newWeeklyData[day].shifts.filter(s => s.openTime && s.closeTime);
        if (dayShifts.length > 0) {
          // Find earliest shift start and latest shift end (trading hours only)
          let earliestStart = 24 * 60; // in minutes
          let latestEnd = 0;

          dayShifts.forEach(shift => {
            const [startHour, startMin] = shift.openTime.split(':').map(Number);
            const shiftStartMinutes = startHour * 60 + startMin;

            const [endHour, endMin] = shift.closeTime.split(':').map(Number);
            let shiftEndMinutes = endHour * 60 + endMin;

            // Handle closing after midnight
            if (shiftEndMinutes < shiftStartMinutes) {
              shiftEndMinutes += 24 * 60;
            }

            earliestStart = Math.min(earliestStart, shiftStartMinutes);
            latestEnd = Math.max(latestEnd, shiftEndMinutes);
          });

          // Convert back to time format
          const venueOpenHour = Math.floor(earliestStart / 60);
          const venueOpenMin = earliestStart % 60;
          const venueCloseHour = Math.floor(latestEnd / 60) % 24;
          const venueCloseMin = latestEnd % 60;

          (newVenueOpeningHours as any)[day] = {
            isOpen: true,
            windows: [{
              id: crypto.randomUUID(),
              openTime: `${String(venueOpenHour).padStart(2, '0')}:${String(venueOpenMin).padStart(2, '0')}`,
              closeTime: `${String(venueCloseHour).padStart(2, '0')}:${String(venueCloseMin).padStart(2, '0')}`,
            }],
          };
          newWeeklyData[day].isOpen = true;
        }
      });
    }

    setWeeklyData(newWeeklyData);
    setVenueOpeningHours(newVenueOpeningHours);
    setWizardStep(4);

    toast({
      title: 'Schedule Applied',
      description: `Parsed ${result.venueHours.length} venue schedule(s) and ${result.shifts.length} service type(s)`,
    });
  };


  const copyToAllDays = (sourceDay: string) => {
    const sourceDayData = weeklyData[sourceDay];
    const newData: WeeklyData = {};
    DAYS.forEach(day => {
      newData[day] = {
        isOpen: sourceDayData.isOpen,
        shifts: sourceDayData.shifts.map(s => ({
          ...s,
          id: crypto.randomUUID(),
        })),
      };
    });
    setWeeklyData(newData);
  };

  const copyToWeekdays = (sourceDay: string) => {
    const sourceDayData = weeklyData[sourceDay];
    setWeeklyData(prev => {
      const newData = { ...prev };
      DAYS.slice(0, 5).forEach(day => {
        newData[day] = {
          isOpen: sourceDayData.isOpen,
          shifts: sourceDayData.shifts.map(s => ({
            ...s,
            id: crypto.randomUUID(),
          })),
        };
      });
      return newData;
    });
  };

  const copyToWeekend = (sourceDay: string) => {
    const sourceDayData = weeklyData[sourceDay];
    setWeeklyData(prev => {
      const newData = { ...prev };
      DAYS.slice(5, 7).forEach(day => {
        newData[day] = {
          isOpen: sourceDayData.isOpen,
          shifts: sourceDayData.shifts.map(s => ({
            ...s,
            id: crypto.randomUUID(),
          })),
        };
      });
      return newData;
    });
  };

  const calculateDayTotals = (dayData: DayData, venueDayHours: VenueDayHours) => {
    if (!dayData.isOpen) {
      return { total: 0, trading: 0, nonTrading: 0 };
    }

    let trading = 0;
    let nonTrading = 0;

    // Calculate trading hours from Venue Opening Hours
    if (venueDayHours.isOpen && venueDayHours.windows.length > 0) {
      venueDayHours.windows.forEach(window => {
        if (window.openTime && window.closeTime) {
          trading += calculateHoursBetween(window.openTime, window.closeTime);
        }
      });
      dayData.shifts.forEach(shift => {
        nonTrading += shift.prepHours + shift.shutdownHours;
      });
      return {
        total: trading + nonTrading,
        trading,
        nonTrading,
      };
    }

    let earliestStart: number | null = null;
    let latestEnd: number | null = null;

    dayData.shifts.forEach(shift => {
      if (shift.openTime && shift.closeTime) {
        const shiftHours = calculateHoursBetween(shift.openTime, shift.closeTime);
        trading += shiftHours;
        nonTrading += shift.prepHours + shift.shutdownHours;

        const [startHours, startMinutes] = shift.openTime.split(':').map(Number);
        let startTime = startHours + startMinutes / 60 - shift.prepHours;
        if (startTime < 0) startTime += 24;

        const [endHours, endMinutes] = shift.closeTime.split(':').map(Number);
        let endTime = endHours + endMinutes / 60 + shift.shutdownHours;

        if (earliestStart === null || startTime < earliestStart) {
          earliestStart = startTime;
        }
        if (latestEnd === null || endTime > latestEnd) {
          latestEnd = endTime;
        }
      }
    });

    let total = trading + nonTrading;
    if (earliestStart !== null && latestEnd !== null) {
      const venueOperatingHours = latestEnd - earliestStart;
      total = Math.max(venueOperatingHours >= 0 ? venueOperatingHours : venueOperatingHours + 24, total);
    }

    return {
      total,
      trading,
      nonTrading,
    };
  };

  const calculateWeeklySummary = () => {
    let totalHours = 0;
    let totalTrading = 0;
    let totalNonTrading = 0;
    let weekdayHours = 0;
    let weekendHours = 0;

    const serviceBreakdown: { [key: string]: number } = {};

    DAYS.forEach((day, index) => {
      const dayData = weeklyData[day];
      const venueDayHours = venueOpeningHours[day as keyof typeof venueOpeningHours];
      const dayTotals = calculateDayTotals(dayData, venueDayHours);

      totalHours += dayTotals.total;
      totalTrading += dayTotals.trading;
      totalNonTrading += dayTotals.nonTrading;

      if (index < 5) {
        weekdayHours += dayTotals.total;
      } else {
        weekendHours += dayTotals.total;
      }

      if (businessType === 'hospitality' && mode === 'service_shifts') {
        dayData.shifts.forEach(shift => {
          const shiftHours = calculateHoursBetween(shift.openTime, shift.closeTime);
          if (!serviceBreakdown[shift.serviceName]) {
            serviceBreakdown[shift.serviceName] = 0;
          }
          serviceBreakdown[shift.serviceName] += shiftHours;
        });
      }
    });

    const avgPerDay = totalHours / 7;

    return {
      totalHours,
      totalTrading,
      totalNonTrading,
      weekdayHours,
      weekendHours,
      avgPerDay,
      serviceBreakdown,
    };
  };

  const weeklySummary = !loading ? calculateWeeklySummary() : null;

  const visualizationData = useMemo(() => {
    if (loading) return null;

    // Transform weeklyData to include venue windows from venueOpeningHours
    const scheduleWithVenueWindows: WeeklySchedule = {} as WeeklySchedule;
    DAYS.forEach(day => {
      const dayData = weeklyData[day];
      const venueDayHours = venueOpeningHours[day as keyof typeof venueOpeningHours];

      (scheduleWithVenueWindows as any)[day] = {
        isOpen: dayData.isOpen,
        shifts: dayData.shifts,
        venueWindows: venueDayHours.isOpen ? venueDayHours.windows.map((w: VenueOpeningWindow) => ({
          id: w.id,
          openTime: w.openTime,
          closeTime: w.closeTime,
        })) : [],
      };
    });

    return transformWeeklyScheduleToVisualizationData(scheduleWithVenueWindows);
  }, [weeklyData, venueOpeningHours, loading]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Step 4. Hours of Operation</CardTitle>
              <CardDescription>Set your operating hours and service schedules</CardDescription>
            </div>
            {wizardStep === 4 && (
              <Button variant="outline" size="sm" onClick={() => { setWizardStep(1); setInputMethod(null); }}>
                Reset Setup
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <>
        {wizardStep < 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Hours of Operation Setup</CardTitle>
            <CardDescription>Step {wizardStep} of 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Step 1: Choose Business Type</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">Select the type that best describes your business</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setBusinessType('hospitality');
                      setWizardStep(2);
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      businessType === 'hospitality' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Hospitality</div>
                    <p className="text-sm text-muted-foreground">Restaurants, cafes, bars with multiple service periods</p>
                  </button>
                  <button
                    onClick={() => {
                      setBusinessType('other');
                      setMode('simple_hours');
                      setWizardStep(3);
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      businessType === 'other' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Other</div>
                    <p className="text-sm text-muted-foreground">Retail, services, or simple operating hours</p>
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Step 2: Choose Operating Mode</Label>
                    <p className="text-sm text-muted-foreground mt-1">How would you like to manage your hours?</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setMode('service_shifts');
                      setWizardStep(3);
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      mode === 'service_shifts' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Service Shifts</div>
                    <p className="text-sm text-muted-foreground">Track breakfast, lunch, dinner, happy hour, etc.</p>
                  </button>
                  <button
                    onClick={() => {
                      setMode('simple_hours');
                      setWizardStep(3);
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      mode === 'simple_hours' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Simple Hours</div>
                    <p className="text-sm text-muted-foreground">Just opening and closing times</p>
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Step 3: How would you like to build your schedule?</Label>
                    <p className="text-sm text-muted-foreground mt-1">Choose your preferred input method</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(businessType === 'hospitality' ? 2 : 1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setInputMethod('natural_language');
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      inputMethod === 'natural_language' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Natural Language</div>
                    <p className="text-sm text-muted-foreground">Describe your hours in plain English and let us parse it</p>
                  </button>
                  <button
                    onClick={() => {
                      setInputMethod('manual');
                      setWizardStep(4);
                    }}
                    className={`p-6 border-2 rounded-lg text-left hover:border-brand transition-colors ${
                      inputMethod === 'manual' ? 'border-brand bg-brand/5' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">Manual Build</div>
                    <p className="text-sm text-muted-foreground">Fill in each day manually with precise control</p>
                  </button>
                </div>

                {inputMethod === 'natural_language' && (
                  <div className="mt-6 p-6 bg-info/10 rounded-lg border-2 border-info/30 space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Describe Your Schedule</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Tell us about your operating hours in plain English. Be as detailed as you like!
                      </p>
                    </div>
                    <Textarea
                      value={naturalLanguageText}
                      onChange={(e) => setNaturalLanguageText(e.target.value)}
                      placeholder="Example: We're open weekdays and sundays 11am till 11pm, fridays and saturdays 11am till midnight. We offer lunch from midday till 2:30pm, happy hour from 4pm-5pm, dinner from 5pm-9pm. We have a 1 hour prep at the start of lunch and the start of dinner, we need an hour to close after dinner and 30 mins to close the bistro at lunch"
                      className="min-h-32 text-sm"
                    />
                    <Button onClick={applyNaturalLanguageSchedule} className="w-full">
                      Apply Schedule <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <div className="bg-surface-1/60 p-4 rounded-md space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Tips for better results:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use "weekdays" (Mon-Fri), "weekends" (Sat-Sun), or specific day names</li>
                        <li>Mention "open" or "we're open" with times for venue hours</li>
                        <li>Use "offer" for services: "we offer lunch from 12pm to 2:30pm"</li>
                        <li>Add prep: "1 hour prep at the start of lunch"</li>
                        <li>Add closing time: "30 mins to close after dinner"</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

        {wizardStep === 4 && (
          <>
          <VenueOpeningHours
            data={venueOpeningHours}
            onUpdate={setVenueOpeningHours}
            timeFormat={timeFormat}
            onUpdateTimeFormat={updateTimeFormatPreference}
          />

          <Card>
            <CardHeader className="text-left">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Shifts</CardTitle>
                  <CardDescription>
                    Optional: Add service periods like Lunch, Dinner, and Happy Hour.
                    <br />
                    Prep and close-down time can occur outside venue opening hours.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Show Service Shifts</Label>
                  <Switch
                    checked={serviceShiftsEnabled}
                    onCheckedChange={setServiceShiftsEnabled}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {serviceShiftsEnabled ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {DAYS.map((day, index) => (
                    <DayCard
                      key={day}
                      day={day}
                      label={DAY_LABELS[index]}
                      dayData={weeklyData[day]}
                      venueDayHours={venueOpeningHours[day as keyof typeof venueOpeningHours]}
                      businessType={businessType}
                      mode={mode}
                      timeFormat={timeFormat}
                      onAddShift={() => addShift(day)}
                      onRemoveShift={(shiftId) => removeShift(day, shiftId)}
                      onUpdateShift={(shiftId, updates) => updateShift(day, shiftId, updates)}
                      onCopyToAll={() => copyToAllDays(day)}
                      onCopyToWeekdays={() => copyToWeekdays(day)}
                      onCopyToWeekend={() => copyToWeekend(day)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    Service shifts are optional. Turn this on if you want to add Lunch/Dinner/Happy Hour periods.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{formatDecimalHours(weeklySummary!.totalHours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trading Hours</p>
              <p className="text-2xl font-bold">{formatDecimalHours(weeklySummary!.totalTrading)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Non-Trading Hours</p>
              <p className="text-2xl font-bold">{formatDecimalHours(weeklySummary!.totalNonTrading)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Per Day</p>
              <p className="text-2xl font-bold">{formatDecimalHours(weeklySummary!.avgPerDay)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Weekday Hours (Mon-Fri)</p>
              <p className="text-xl font-semibold">{formatDecimalHours(weeklySummary!.weekdayHours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weekend Hours (Sat-Sun)</p>
              <p className="text-xl font-semibold">{formatDecimalHours(weeklySummary!.weekendHours)}</p>
            </div>
          </div>

          {Object.keys(weeklySummary!.serviceBreakdown).length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Service Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(weeklySummary!.serviceBreakdown).map(([service, hours]) => (
                    <div key={service} className="text-sm">
                      <span className="text-muted-foreground">{service}:</span>
                      <span className="ml-2 font-medium">{formatDecimalHours(hours)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Daily Schedule Visualization</CardTitle>
          <CardDescription>
            View your weekly schedule at a glance. Toggle between simple venue hours or detailed service shifts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visualizationData ? (
            <HoursScheduleChart
              data={visualizationData}
              timeFormat={timeFormat}
              showLegend={true}
              showTotals={true}
              mode={visualizationMode}
              onModeChange={setVisualizationMode}
              showModeToggle={true}
              onUpdateShift={(day, shiftId, updates) => {
                setWeeklyData(prev => ({
                  ...prev,
                  [day]: {
                    ...prev[day],
                    shifts: prev[day].shifts.map(s =>
                      s.id === shiftId ? { ...s, ...updates } : s
                    ),
                  },
                }));
              }}
              onUpdateVenueWindow={(day, windowId, updates) => {
                setVenueOpeningHours(prev => ({
                  ...prev,
                  [day]: {
                    ...prev[day as keyof typeof prev],
                    windows: prev[day as keyof typeof prev].windows.map(w =>
                      w.id === windowId ? { ...w, ...updates } : w
                    ),
                  },
                }));
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No schedule data available</p>
          )}
        </CardContent>
      </Card>
          </>
        )}
        </>
      )}

      {project && onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.HOURS_OF_OPERATION}
          onNavigate={onNavigate}
          showPrevious={true}
        />
      )}
    </div>
  );
}

interface DayCardProps {
  day: string;
  label: string;
  dayData: DayData;
  venueDayHours: VenueDayHours;
  businessType: 'hospitality' | 'other';
  mode: 'service_shifts' | 'simple_hours';
  timeFormat: TimeFormat;
  onAddShift: () => void;
  onRemoveShift: (shiftId: string) => void;
  onUpdateShift: (shiftId: string, updates: Partial<Shift>) => void;
  onCopyToAll: () => void;
  onCopyToWeekdays: () => void;
  onCopyToWeekend: () => void;
}

function DayCard({
  label,
  dayData,
  venueDayHours,
  businessType,
  mode,
  timeFormat,
  onAddShift,
  onRemoveShift,
  onUpdateShift,
  onCopyToAll,
  onCopyToWeekdays,
  onCopyToWeekend,
}: DayCardProps) {
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
    };

    if (showCopyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCopyMenu]);

  // Helper function to check if a time falls within venue opening windows
  const isTimeWithinVenueHours = (time: string): boolean => {
    if (!venueDayHours.isOpen || venueDayHours.windows.length === 0) {
      return true; // No venue hours constraint
    }

    const timeMinutes = timeToMinutes(time);

    return venueDayHours.windows.some(window => {
      if (!window.openTime || !window.closeTime) return false;

      const openMinutes = timeToMinutes(window.openTime);
      let closeMinutes = timeToMinutes(window.closeTime);

      // Handle closing after midnight
      if (closeMinutes < openMinutes) {
        closeMinutes += 24 * 60;
      }

      let checkTimeMinutes = timeMinutes;
      // If checking a time that might be after midnight
      if (timeMinutes < openMinutes && closeMinutes > 24 * 60) {
        checkTimeMinutes += 24 * 60;
      }

      return checkTimeMinutes >= openMinutes && checkTimeMinutes <= closeMinutes;
    });
  };

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check if any shifts are outside venue opening hours
  const shiftsOutsideVenueHours = dayData.shifts.filter(shift => {
    if (!shift.openTime || !shift.closeTime) return false;
    if (!venueDayHours.isOpen || venueDayHours.windows.length === 0) return false;
    return !isTimeWithinVenueHours(shift.openTime) || !isTimeWithinVenueHours(shift.closeTime);
  });

  const dayTotals = (() => {
    if (!dayData.isOpen) return { total: 0, trading: 0, nonTrading: 0 };

    let trading = 0;
    let nonTrading = 0;

    // Calculate trading hours from Venue Opening Hours
    if (venueDayHours.isOpen && venueDayHours.windows.length > 0) {
      venueDayHours.windows.forEach(window => {
        if (window.openTime && window.closeTime) {
          trading += calculateHoursBetween(window.openTime, window.closeTime);
        }
      });
      dayData.shifts.forEach(shift => {
        nonTrading += shift.prepHours + shift.shutdownHours;
      });
      return {
        total: trading + nonTrading,
        trading,
        nonTrading,
      };
    }

    let earliestStart: number | null = null;
    let latestEnd: number | null = null;

    dayData.shifts.forEach(shift => {
      if (shift.openTime && shift.closeTime) {
        const shiftHours = calculateHoursBetween(shift.openTime, shift.closeTime);
        trading += shiftHours;
        nonTrading += shift.prepHours + shift.shutdownHours;

        const [startHours, startMinutes] = shift.openTime.split(':').map(Number);
        let startTime = startHours + startMinutes / 60 - shift.prepHours;
        if (startTime < 0) startTime += 24;

        const [endHours, endMinutes] = shift.closeTime.split(':').map(Number);
        let endTime = endHours + endMinutes / 60 + shift.shutdownHours;

        if (earliestStart === null || startTime < earliestStart) {
          earliestStart = startTime;
        }
        if (latestEnd === null || endTime > latestEnd) {
          latestEnd = endTime;
        }
      }
    });

    let total = trading + nonTrading;
    if (earliestStart !== null && latestEnd !== null) {
      const venueOperatingHours = latestEnd - earliestStart;
      total = Math.max(venueOperatingHours >= 0 ? venueOperatingHours : venueOperatingHours + 24, total);
    }

    return {
      total,
      trading,
      nonTrading,
    };
  })();

  const isSimpleHoursMode = businessType === 'other' || (businessType === 'hospitality' && mode === 'simple_hours');

  return (
    <Card>
      <CardHeader className="pb-3 bg-muted rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative" ref={copyMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCopyMenu(!showCopyMenu)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {showCopyMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-popover border rounded-md shadow-lg z-10">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onCopyToAll();
                      setShowCopyMenu(false);
                    }}
                  >
                    Copy to All
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onCopyToWeekdays();
                      setShowCopyMenu(false);
                    }}
                  >
                    Copy to Weekdays
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      onCopyToWeekend();
                      setShowCopyMenu(false);
                    }}
                  >
                    Copy to Weekend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!venueDayHours.isOpen ? (
          <div className="space-y-3 py-6">
            <div className="text-center text-muted-foreground">
              <p className="font-medium">This day is closed</p>
              <p className="text-sm mt-1">Day is closed in Venue Opening Hours</p>
            </div>
          </div>
        ) : (
          <>
            {shiftsOutsideVenueHours.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Warning:</strong> Some service shifts fall outside Venue Opening Hours.
                  Please adjust either the service shift times or the venue opening windows in the Venue Opening Hours section above.
                </div>
              </div>
            )}

            {isSimpleHoursMode ? (
              dayData.shifts.length > 0 && (
                <ShiftCard
                  key={dayData.shifts[0].id}
                  shift={dayData.shifts[0]}
                  businessType={businessType}
                  mode={mode}
                  timeFormat={timeFormat}
                  isSimpleHours={isSimpleHoursMode}
                  shiftNumber={1}
                  canRemove={false}
                  onUpdate={(updates) => onUpdateShift(dayData.shifts[0].id, updates)}
                  onRemove={() => {}}
                />
              )
            ) : (
              <>
                {dayData.shifts.length === 0 && (
                  <div className="text-center py-4">
                    <Button variant="outline" size="sm" onClick={onAddShift}>
                      <Plus className="h-4 w-4 mr-1" /> Add Shift
                    </Button>
                  </div>
                )}

                {dayData.shifts.map((shift, index) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    businessType={businessType}
                    mode={mode}
                    timeFormat={timeFormat}
                    isSimpleHours={false}
                    shiftNumber={index + 1}
                    canRemove={true}
                    onUpdate={(updates) => onUpdateShift(shift.id, updates)}
                    onRemove={() => onRemoveShift(shift.id)}
                  />
                ))}

                {dayData.shifts.length > 0 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={onAddShift}>
                    <Plus className="h-4 w-4 mr-1" /> Add Shift
                  </Button>
                )}
              </>
            )}

            <Separator />

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total</p>
                <p className="font-semibold">{formatDecimalHours(dayTotals.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Trading</p>
                <p className="font-semibold">{formatDecimalHours(dayTotals.trading)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Non-Trading</p>
                <p className="font-semibold">{formatDecimalHours(dayTotals.nonTrading)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ShiftCardProps {
  shift: Shift;
  businessType: 'hospitality' | 'other';
  mode: 'service_shifts' | 'simple_hours';
  timeFormat: TimeFormat;
  isSimpleHours: boolean;
  shiftNumber: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<Shift>) => void;
  onRemove: () => void;
}

function ShiftCard({ shift, businessType, mode, timeFormat, isSimpleHours, canRemove, onUpdate, onRemove }: ShiftCardProps) {
  const [openTimeInput, setOpenTimeInput] = useState(shift.openTime ? formatTime(shift.openTime, timeFormat) : '');
  const [closeTimeInput, setCloseTimeInput] = useState(shift.closeTime ? formatTime(shift.closeTime, timeFormat) : '');

  useEffect(() => {
    setOpenTimeInput(shift.openTime ? formatTime(shift.openTime, timeFormat) : '');
    setCloseTimeInput(shift.closeTime ? formatTime(shift.closeTime, timeFormat) : '');
  }, [shift.openTime, shift.closeTime, timeFormat]);

  const handleOpenTimeBlur = () => {
    const parsed = parseTimeInput(openTimeInput);
    if (parsed) {
      onUpdate({ openTime: parsed });
      setOpenTimeInput(formatTime(parsed, timeFormat));
    } else if (openTimeInput) {
      setOpenTimeInput(shift.openTime ? formatTime(shift.openTime, timeFormat) : '');
    }
  };

  const handleCloseTimeBlur = () => {
    const parsed = parseTimeInput(closeTimeInput);
    if (parsed) {
      onUpdate({ closeTime: parsed });
      setCloseTimeInput(formatTime(parsed, timeFormat));
    } else if (closeTimeInput) {
      setCloseTimeInput(shift.closeTime ? formatTime(shift.closeTime, timeFormat) : '');
    }
  };

  const handlePrepChange = (value: string) => {
    const hours = parseDecimalHours(value);
    onUpdate({ prepHours: hours });
  };

  const handleShutdownChange = (value: string) => {
    const hours = parseDecimalHours(value);
    onUpdate({ shutdownHours: hours });
  };

  const shiftHours = calculateHoursBetween(shift.openTime, shift.closeTime);

  return (
    <div className="border rounded-md p-3 space-y-2 bg-surface-2">
      {!isSimpleHours && (
        <div className="flex items-center justify-between">
          {businessType === 'hospitality' && mode === 'service_shifts' ? (
            <Select value={shift.serviceName} onValueChange={(v) => onUpdate({ serviceName: v })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={shift.serviceName}
              onChange={(e) => onUpdate({ serviceName: e.target.value })}
              placeholder="Shift name"
              className="h-8 text-sm"
            />
          )}
          {canRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isSimpleHours ? 'Open' : 'Start'}</Label>
          <Input
            value={openTimeInput}
            onChange={(e) => setOpenTimeInput(e.target.value)}
            onBlur={handleOpenTimeBlur}
            placeholder="e.g. 8am"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isSimpleHours ? 'Close' : 'Finish'}</Label>
          <Input
            value={closeTimeInput}
            onChange={(e) => setCloseTimeInput(e.target.value)}
            onBlur={handleCloseTimeBlur}
            placeholder="e.g. 5pm"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {!isSimpleHours && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Prep (hrs)</Label>
            <Input
              type="text"
              defaultValue={shift.prepHours}
              onBlur={(e) => handlePrepChange(e.target.value)}
              placeholder="0 or 1:30"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Shutdown (hrs)</Label>
            <Input
              type="text"
              defaultValue={shift.shutdownHours}
              onBlur={(e) => handleShutdownChange(e.target.value)}
              placeholder="0 or 0:30"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {!isSimpleHours && shift.openTime && shift.closeTime && (
        <div className="text-xs text-muted-foreground text-center">
          Service Hours: {formatDecimalHours(shiftHours)}
        </div>
      )}
    </div>
  );
}
