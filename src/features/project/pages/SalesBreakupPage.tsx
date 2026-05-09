import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { OrderSourceBreakdownItem, OrderSourceKey, ProjectData } from '@/lib/types/projectTypes';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';
import { WalkthroughNavigation } from '@/features/project/components/WalkthroughNavigation';

interface ProjectScenarioData {
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
  customFixedCosts: Array<{ id: string; name: string; value: number }>;
}

interface SalesBreakupProps {
  projectId: string | null;
  detailedBreakEvenData: {
    scenario1: ProjectScenarioData;
    scenario2: ProjectScenarioData;
    scenario3: ProjectScenarioData;
  };
  period: 'Weekly' | 'Monthly' | 'Yearly';
  project?: ProjectData;
  onProjectChange?: (patch: Partial<ProjectData>) => void;
  onNavigate?: (route: string) => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface OrderTypeSplit {
  [key: string]: number;
}

const ORDER_TYPE_OPTIONS = [
  'Dine-In',
  'Takeaway',
  'Pickup',
  'Delivery',
  'Drive Through',
  'Catering'
];

const ORDER_SOURCE_LABELS: Record<OrderSourceKey, string> = {
  orderInVenue: 'Order in Venue',
  phone: 'Over the Phone',
  appBiteBusiness: 'Your App (Bite Business)',
  appOther: 'Your App (Other Provider)',
  website: 'From Your Website',
  uberDelivery: 'Uber Eats – Delivery',
  uberPickup: 'Uber Eats – Pickup',
  doordashDelivery: 'DoorDash – Delivery',
  doordashPickup: 'DoorDash – Pickup',
};

const ORDER_SOURCE_DESCRIPTIONS: Record<OrderSourceKey, string> = {
  orderInVenue: 'Order in Venue',
  phone: 'Over the Phone',
  appBiteBusiness: 'Your App (Bite Business) - $50/week flat fee',
  appOther: 'Your App (Other Provider) - 6%',
  website: 'From Your Website',
  uberDelivery: 'Uber Eats – Delivery - 30%',
  uberPickup: 'Uber Eats – Pickup - 15%',
  doordashDelivery: 'DoorDash – Delivery - 30%',
  doordashPickup: 'DoorDash – Pickup - 15%',
};

interface DaySplit {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

interface ServiceSplit {
  [key: string]: number;
}

type ViewMode = 'percentage' | 'custom' | 'scenario1' | 'scenario2' | 'scenario3';

export function SalesBreakup({ projectId, detailedBreakEvenData, period, project, onProjectChange, onNavigate }: SalesBreakupProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  const [customSales, setCustomSales] = useState<number>(50000);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [tempCustomSales, setTempCustomSales] = useState<string>('50000');
  const [orderType, setOrderType] = useState<OrderTypeSplit>(
    project?.salesBreakup?.orderTypePercentages ? {
      'Dine-In': project.salesBreakup.orderTypePercentages.dineIn || 0,
      'Takeaway': project.salesBreakup.orderTypePercentages.takeaway || 0,
      ...(project.salesBreakup.orderTypePercentages.delivery ? { 'Delivery': project.salesBreakup.orderTypePercentages.delivery } : {}),
    } : { 'Dine-In': 50.0, 'Takeaway': 50.0 }
  );
  const [days, setDays] = useState<DaySplit>(
    project?.salesBreakup ? {
      mon: project.salesBreakup.dayPercentages.monday,
      tue: project.salesBreakup.dayPercentages.tuesday,
      wed: project.salesBreakup.dayPercentages.wednesday,
      thu: project.salesBreakup.dayPercentages.thursday,
      fri: project.salesBreakup.dayPercentages.friday,
      sat: project.salesBreakup.dayPercentages.saturday,
      sun: project.salesBreakup.dayPercentages.sunday,
    } : {
      mon: 5.0,
      tue: 5.0,
      wed: 5.0,
      thu: 10.0,
      fri: 25.0,
      sat: 30.0,
      sun: 20.0,
    }
  );
  const [services, setServices] = useState<ServiceSplit>(
    project?.salesBreakup?.servicePercentages || {}
  );
  const [hoursData, setHoursData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeData = async () => {
      import.meta.env.DEV && console.log('[SalesBreakup] ============================================');
      import.meta.env.DEV && console.log('[SalesBreakup] Starting initial load');
      import.meta.env.DEV && console.log('[SalesBreakup] Project data:', project?.salesBreakup);
      import.meta.env.DEV && console.log('[SalesBreakup] ============================================');
      setInitialLoadComplete(false);

      // Load hours data first to get available services
      const loadedHoursData = await loadHoursDataAndReturn();

      // Check if we have existing project data (not from DB, from local state)
      const hasProjectData = project?.salesBreakup &&
        Object.keys(project.salesBreakup.servicePercentages || {}).length > 0;

      import.meta.env.DEV && console.log('[SalesBreakup] Has project data:', hasProjectData);

      // Only try to load from DB if we have a projectId AND no local project data
      let hasDataInDB = false;
      if (projectId && !hasProjectData) {
        hasDataInDB = await loadData(loadedHoursData);
      }

      // Initialize services only if no data from project prop AND no data from DB
      if (!hasProjectData && !hasDataInDB && loadedHoursData?.weekly_data) {
        const availableServices = extractAvailableServices(loadedHoursData.weekly_data);
        const initialServices: ServiceSplit = {};

        if (availableServices.length === 3) {
          initialServices[availableServices[0]] = 30;
          initialServices[availableServices[1]] = 30;
          initialServices[availableServices[2]] = 40;
        } else {
          const evenSplit = availableServices.length > 0 ? 100 / availableServices.length : 0;
          availableServices.forEach(service => {
            initialServices[service] = evenSplit;
          });
        }

        import.meta.env.DEV && console.log('[SalesBreakup] Initializing services with defaults (NO DATA):', initialServices);
        setServices(initialServices);
      }

      setLoading(false);
      setInitialLoadComplete(true);
      import.meta.env.DEV && console.log('[SalesBreakup] *** initialLoadComplete set to TRUE ***');
      import.meta.env.DEV && console.log('[SalesBreakup] ============================================');
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (hoursData?.weekly_data && !loading) {
      const dayMapping: Record<string, keyof DaySplit> = {
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed',
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun'
      };

      const updatedDays = { ...days };
      let hasChanges = false;

      Object.keys(dayMapping).forEach(dayFull => {
        const dayShort = dayMapping[dayFull];
        const dayData = hoursData.weekly_data[dayFull];

        // If day is closed in hours, set to 0%
        if (dayData && !dayData.isOpen && updatedDays[dayShort] > 0) {
          updatedDays[dayShort] = 0;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setDays(updatedDays);
      }
    }

  }, [hoursData, loading]);


  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('hours-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hours_of_operation',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // When hours change, reload hours data
            loadHoursDataAndReturn();
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadHoursDataAndReturn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('hours_of_operation')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setHoursData(data);
        import.meta.env.DEV && console.log('[SalesBreakup] Hours data loaded:', data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error loading hours data:', error);
      return null;
    }
  };

  const extractAvailableServices = (weeklyData: any): string[] => {
    const servicesArray: string[] = [];
    const servicesSet = new Set<string>();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    dayKeys.forEach(day => {
      const dayData = weeklyData[day];
      if (dayData && dayData.isOpen && dayData.shifts) {
        dayData.shifts.forEach((shift: any) => {
          if (shift.serviceName && !servicesSet.has(shift.serviceName)) {
            servicesSet.add(shift.serviceName);
            servicesArray.push(shift.serviceName);
          }
        });
      }
    });

    return servicesArray;
  };

  const loadData = async (hoursDataParam: any): Promise<boolean> => {
    import.meta.env.DEV && console.log('[SalesBreakup] === LOAD DATA START ===');
    if (!projectId) {
      setLoading(false);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('sales_breakup')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;

      import.meta.env.DEV && console.log('[SalesBreakup] *** LOADED DATA FROM DB ***:', data);

      if (data) {
        // Load order types - check if stored as JSONB or legacy columns
        if (data.order_types && typeof data.order_types === 'object') {
          const orderTypesData: OrderTypeSplit = {};
          Object.keys(data.order_types).forEach(key => {
            orderTypesData[key] = Number(data.order_types[key]);
          });
          import.meta.env.DEV && console.log('[SalesBreakup] Setting order types:', orderTypesData);
          setOrderType(orderTypesData);
        } else if (data.order_type_dine_in !== undefined || data.order_type_takeaway !== undefined) {
          // Legacy format
          const legacyOrderTypes = {
            'Dine-In': Number(data.order_type_dine_in || 0),
            'Takeaway': Number(data.order_type_takeaway || 0),
          };
          import.meta.env.DEV && console.log('[SalesBreakup] Setting legacy order types:', legacyOrderTypes);
          setOrderType(legacyOrderTypes);
        }

        // Load days
        const loadedDays = {
          mon: Number(data.days_mon),
          tue: Number(data.days_tue),
          wed: Number(data.days_wed),
          thu: Number(data.days_thu),
          fri: Number(data.days_fri),
          sat: Number(data.days_sat),
          sun: Number(data.days_sun),
        };
        import.meta.env.DEV && console.log('[SalesBreakup] Setting days:', loadedDays);
        setDays(loadedDays);
        import.meta.env.DEV && console.log('[SalesBreakup] Days state updated');

        // Load services and ensure they match current hours of operation
        let servicesData: ServiceSplit = {};
        if (data.services && typeof data.services === 'object') {
          Object.keys(data.services).forEach(key => {
            servicesData[key] = Number(data.services[key]);
          });
        }
        import.meta.env.DEV && console.log('[SalesBreakup] Raw services from DB:', servicesData);

        // Clean up services to match hours of operation (one-time on load)
        if (hoursDataParam?.weekly_data) {
          const currentAvailableServices = extractAvailableServices(hoursDataParam.weekly_data);
          import.meta.env.DEV && console.log('[SalesBreakup] Available services from hours:', currentAvailableServices);
          const cleanedServices: ServiceSplit = {};

          currentAvailableServices.forEach(service => {
            // Try to find a matching service in loaded data (case-insensitive)
            const existingKey = Object.keys(servicesData).find(
              key => key.toLowerCase() === service.toLowerCase()
            );

            if (existingKey) {
              cleanedServices[service] = servicesData[existingKey];
              import.meta.env.DEV && console.log(`[SalesBreakup] Matched service "${service}" with saved "${existingKey}": ${servicesData[existingKey]}%`);
            } else {
              cleanedServices[service] = 0;
              import.meta.env.DEV && console.log(`[SalesBreakup] New service "${service}" - setting to 0%`);
            }
          });

          servicesData = cleanedServices;
          import.meta.env.DEV && console.log('[SalesBreakup] Services after cleaning:', servicesData);
        }

        import.meta.env.DEV && console.log('[SalesBreakup] Final cleaned services to set:', servicesData);
        setServices(servicesData);
        import.meta.env.DEV && console.log('[SalesBreakup] Services state updated');
        setLoading(false);
        import.meta.env.DEV && console.log('[SalesBreakup] Loading set to false');
        import.meta.env.DEV && console.log('[SalesBreakup] *** DATA LOAD COMPLETE - ALL STATE SET ***');
        return true;
      } else {
        setLoading(false);
        import.meta.env.DEV && console.log('[SalesBreakup] No existing data found in DB');
        return false;
      }
    } catch (error) {
      console.error('Error loading sales breakup data:', error);
      setLoading(false);
      return false;
    }
  };

  const saveData = async () => {
    import.meta.env.DEV && console.log('[SalesBreakup] ======================================');
    import.meta.env.DEV && console.log('[SalesBreakup] saveData() CALLED');
    import.meta.env.DEV && console.log('[SalesBreakup] ======================================');

    if (!projectId) {
      import.meta.env.DEV && console.log('[SalesBreakup] ❌ SAVE ABORTED: No projectId');
      return;
    }

    import.meta.env.DEV && console.log('[SalesBreakup] ✓ ProjectId exists:', projectId);
    import.meta.env.DEV && console.log('[SalesBreakup] === SAVING DATA ===');
    import.meta.env.DEV && console.log('[SalesBreakup] Days:', days);
    import.meta.env.DEV && console.log('[SalesBreakup] Services:', services);
    import.meta.env.DEV && console.log('[SalesBreakup] OrderType:', orderType);

    try {
      const { data: existing } = await supabase
        .from('sales_breakup')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      // Prepare data payload
      const dataPayload: any = {
        days_mon: days.mon,
        days_tue: days.tue,
        days_wed: days.wed,
        days_thu: days.thu,
        days_fri: days.fri,
        days_sat: days.sat,
        days_sun: days.sun,
        services: services,
        order_types: orderType,
      };

      if (existing) {
        import.meta.env.DEV && console.log('[SalesBreakup] Existing record found, will UPDATE. ID:', existing.id);
        dataPayload.updated_at = new Date().toISOString();
        const { error } = await supabase
          .from('sales_breakup')
          .update(dataPayload)
          .eq('id', existing.id);

        if (error) {
          console.error('[SalesBreakup] ❌ UPDATE FAILED:', error);
          throw error;
        }
        import.meta.env.DEV && console.log('[SalesBreakup] ✓ UPDATE SUCCESS - Record updated in database');
      } else {
        import.meta.env.DEV && console.log('[SalesBreakup] No existing record, will INSERT new record');
        dataPayload.project_id = projectId;
        const { error } = await supabase
          .from('sales_breakup')
          .insert(dataPayload);

        if (error) {
          console.error('[SalesBreakup] ❌ INSERT FAILED:', error);
          throw error;
        }
        import.meta.env.DEV && console.log('[SalesBreakup] ✓ INSERT SUCCESS - New record created in database');
      }

      import.meta.env.DEV && console.log('[SalesBreakup] ======================================');
      import.meta.env.DEV && console.log('[SalesBreakup] ✓✓✓ SAVE COMPLETED SUCCESSFULLY ✓✓✓');
      import.meta.env.DEV && console.log('[SalesBreakup] ======================================');

      toast({
        title: 'Saved',
        description: 'Sales breakup data saved successfully',
      });
    } catch (error) {
      console.error('[SalesBreakup] ======================================');
      console.error('[SalesBreakup] ❌❌❌ SAVE FAILED ❌❌❌');
      console.error('[SalesBreakup] Error details:', error);
      console.error('[SalesBreakup] ======================================');
      toast({
        title: 'Error',
        description: 'Failed to save sales breakup data',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    import.meta.env.DEV && console.log('[SalesBreakup] Auto-save effect triggered. Conditions:', {
      loading,
      initialLoadComplete,
      hasCallback: !!onProjectChange,
      canSave: !loading && initialLoadComplete && onProjectChange
    });

    if (!loading && initialLoadComplete && onProjectChange) {
      import.meta.env.DEV && console.log('[SalesBreakup] *** AUTO-SAVE TRIGGERED *** Will save in 300ms');
      import.meta.env.DEV && console.log('[SalesBreakup] Current data to be saved:', { days, services, orderType });
      const timer = setTimeout(() => {
        import.meta.env.DEV && console.log('[SalesBreakup] *** EXECUTING AUTO-SAVE NOW ***');

        // Save to database if projectId exists
        if (projectId) {
          saveData();
        }

        // Always sync to local project data structure
        if (onProjectChange) {
          // Calculate weekly sales from current view or use a default
          const weeklySales = viewMode === 'scenario1' ? detailedBreakEvenData.scenario1.enteredSales :
                              viewMode === 'scenario2' ? detailedBreakEvenData.scenario2.enteredSales :
                              viewMode === 'scenario3' ? detailedBreakEvenData.scenario3.enteredSales :
                              viewMode === 'custom' ? customSales :
                              project?.salesBreakup?.weeklySales || 0;

          // Save services directly with their actual names (from hours of operation)
          // This preserves names like "Lunch", "Happy Hour", "Dinner" etc.
          const servicePercentages = { ...services };
          import.meta.env.DEV && console.log('[SalesBreakup] Saving services:', servicePercentages);

          // Map order types to dineIn/takeaway/delivery for project structure
          const orderTypeKeys = Object.keys(orderType);
          const orderTypePercentages: any = {
            dineIn: 0,
            takeaway: 0,
            delivery: 0,
          };

          orderTypeKeys.forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('dine') || lowerKey.includes('in')) {
              orderTypePercentages.dineIn = orderType[key];
            } else if (lowerKey.includes('takeaway') || lowerKey.includes('pickup')) {
              orderTypePercentages.takeaway = orderType[key];
            } else if (lowerKey.includes('delivery') || lowerKey.includes('uber') || lowerKey.includes('doordash')) {
              orderTypePercentages.delivery = orderType[key];
            }
          });

          import.meta.env.DEV && console.log('[SalesBreakup] ✓✓✓ DATA SAVED TO LOCAL STATE ✓✓✓');
          onProjectChange({
            salesBreakup: {
              weeklySales,
              orderTypePercentages,
              dayPercentages: {
                monday: days.mon,
                tuesday: days.tue,
                wednesday: days.wed,
                thursday: days.thu,
                friday: days.fri,
                saturday: days.sat,
                sunday: days.sun,
              },
              servicePercentages,
            },
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [orderType, days, services, loading, initialLoadComplete, onProjectChange]);

  const availableServices = hoursData?.weekly_data ? extractAvailableServices(hoursData.weekly_data) : [];

  const selectedOrderTypes = Object.keys(orderType);
  const availableOrderTypes = ORDER_TYPE_OPTIONS.filter(type => !selectedOrderTypes.includes(type));

  const addOrderType = (type: string) => {
    setOrderType(prev => ({ ...prev, [type]: 0 }));
  };

  const removeOrderType = (type: string) => {
    setOrderType(prev => {
      const newOrderTypes = { ...prev };
      delete newOrderTypes[type];
      return newOrderTypes;
    });
  };

  const orderSources = project?.orderSources || [{ key: "orderInVenue", label: "Order in Venue", percent: 100 }];

  const availableOrderSourceKeys = (Object.keys(ORDER_SOURCE_LABELS) as OrderSourceKey[]).filter(
    key => !orderSources.some(source => source.key === key)
  );

  const addOrderSource = (key: OrderSourceKey) => {
    const label = ORDER_SOURCE_LABELS[key];
    const newSource: OrderSourceBreakdownItem = { key, label, percent: 0 };
    onProjectChange?.({ orderSources: [...orderSources, newSource] });
  };

  const removeOrderSource = (key: OrderSourceKey) => {
    if (orderSources.length === 1) return;
    onProjectChange?.({ orderSources: orderSources.filter(s => s.key !== key) });
  };

  const updateOrderSourcePercent = (key: OrderSourceKey, percent: number) => {
    onProjectChange?.({
      orderSources: orderSources.map(s =>
        s.key === key ? { ...s, percent } : s
      )
    });
  };

  const orderSourceSum = orderSources.reduce((sum, source) => sum + source.percent, 0);
  const orderSourceStatus = Math.abs(orderSourceSum - 100) < 0.1 ? 'OK' : 'Check';

  const isDayClosed = (day: string): boolean => {
    if (!hoursData?.weekly_data) return false;
    const dayMapping: Record<string, string> = {
      'mon': 'monday',
      'tue': 'tuesday',
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    };
    const fullDayName = dayMapping[day];
    const dayData = hoursData.weekly_data[fullDayName];
    return dayData && !dayData.isOpen;
  };

  const orderTypeSum = Object.values(orderType).reduce((sum, val) => sum + val, 0);
  const daysSum = days.mon + days.tue + days.wed + days.thu + days.fri + days.sat + days.sun;
  // Only sum services that are currently available from hours of operation
  const serviceSum = availableServices.reduce((sum, service) => sum + (services[service] || 0), 0);

  const orderTypeStatus = Math.abs(orderTypeSum - 100) < 0.1 ? 'OK' : 'Check';
  const daysStatus = Math.abs(daysSum - 100) < 0.1 ? 'OK' : 'Check';
  const serviceStatus = Math.abs(serviceSum - 100) < 0.1 ? 'OK' : 'Check';

  const handleNumberInput = (
    value: string,
    setter: (val: any) => void,
    key: string
  ) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');

    // Allow empty string for clearing
    if (cleaned === '') {
      setter((prev: any) => ({ ...prev, [key]: 0 }));
      return;
    }

    // Don't allow multiple decimal points
    if ((cleaned.match(/\./g) || []).length > 1) {
      return;
    }

    // Allow partial input like "1." or "."
    if (cleaned === '.' || cleaned.endsWith('.')) {
      const num = parseFloat(cleaned) || 0;
      setter((prev: any) => ({ ...prev, [key]: num }));
      return;
    }

    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    const clamped = Math.max(0, Math.min(100, num));
    setter((prev: any) => ({ ...prev, [key]: clamped }));
  };

  const formatInputValue = (value: number): string => {
    return value.toString();
  };

  const dayServiceMatrix = calculateDayServiceMatrix();

  function calculateDayServiceMatrix() {
    const dayKeys: (keyof DaySplit)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayFullNames: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const matrix: Record<string, Record<string, number>> = {};

    // Initialize matrix with available services
    dayKeys.forEach((d) => {
      matrix[d] = {};
      availableServices.forEach(service => {
        matrix[d][service] = 0;
      });
    });

    const hasHoursData = hoursData && hoursData.weekly_data && typeof hoursData.weekly_data === 'object';

    dayKeys.forEach((dayShort, idx) => {
      const dayPct = days[dayShort];

      if (dayPct <= 0) {
        return;
      }

      if (!hasHoursData) {
        // Without hours data, distribute evenly across all services
        availableServices.forEach(service => {
          const servicePct = services[service] || 0;
          matrix[dayShort][service] = parseFloat(((dayPct * servicePct) / 100).toFixed(1));
        });
        return;
      }

      const dayFull = dayFullNames[idx];
      const dayData = hoursData.weekly_data[dayFull];

      if (!dayData || !dayData.isOpen) {
        return;
      }

      // Check which services are active on this day
      availableServices.forEach(service => {
        const hasService = dayData?.shifts?.some((s: any) => s.serviceName === service);
        if (hasService) {
          const servicePct = services[service] || 0;
          matrix[dayShort][service] = parseFloat(((dayPct * servicePct) / 100).toFixed(1));
        }
      });
    });

    return matrix;
  }

  const getSalesAmount = (): number => {
    switch (viewMode) {
      case 'percentage':
        return 0;
      case 'custom':
        return customSales;
      case 'scenario1':
        return detailedBreakEvenData.scenario1.enteredSales;
      case 'scenario2':
        return detailedBreakEvenData.scenario2.enteredSales;
      case 'scenario3':
        return detailedBreakEvenData.scenario3.enteredSales;
      default:
        return 0;
    }
  };

  const handleCustomSalesSubmit = () => {
    const value = parseFloat(tempCustomSales);
    if (!isNaN(value) && value > 0) {
      setCustomSales(value);
      setViewMode('custom');
      setShowCustomDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 6. Sales Breakup</CardTitle>
          <CardDescription>Allocate sales by order type, day of week, and service</CardDescription>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Source Split</CardTitle>
          <CardDescription>How do customers place their orders? Add channels and assign percentages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderSources.map((source) => (
            <div key={source.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{source.label} (%)</Label>
                {orderSources.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOrderSource(source.key)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                type="text"
                inputMode="decimal"
                value={formatInputValue(source.percent)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^\d.]/g, '');
                  if (cleaned === '') {
                    updateOrderSourcePercent(source.key, 0);
                    return;
                  }
                  if ((cleaned.match(/\./g) || []).length > 1) return;
                  const parsed = parseFloat(cleaned);
                  if (!isNaN(parsed)) {
                    updateOrderSourcePercent(source.key, parsed);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          ))}

          {availableOrderSourceKeys.length > 0 && (
            <div className="pt-2">
              <Select onValueChange={(key) => addOrderSource(key as OrderSourceKey)}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Order Source</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableOrderSourceKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {ORDER_SOURCE_DESCRIPTIONS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Total: {orderSourceSum.toFixed(1)}%</span>
            <Badge
              variant={orderSourceStatus === 'OK' ? 'default' : 'destructive'}
              className={orderSourceStatus === 'OK' ? 'bg-success' : ''}
              title={orderSourceStatus !== 'OK' ? 'Order Source percentages must total 100%' : ''}
            >
              {orderSourceStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Type Split</CardTitle>
            <CardDescription>Percentage breakdown by order type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOrderTypes.map((type) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{type} (%)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOrderType(type)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formatInputValue(orderType[type])}
                  onChange={(e) => handleNumberInput(e.target.value, setOrderType, type)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            ))}

            {availableOrderTypes.length > 0 && (
              <div className="pt-2">
                <Select onValueChange={addOrderType}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Order Type</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrderTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedOrderTypes.length > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Sum: {orderTypeSum.toFixed(1)}%</span>
                <Badge variant={orderTypeStatus === 'OK' ? 'default' : 'destructive'} className={orderTypeStatus === 'OK' ? 'bg-success' : ''}>
                  {orderTypeStatus}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Days of Week Split</CardTitle>
            <CardDescription>Percentage breakdown by day (auto-adjusts for closed days)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
              const isClosed = isDayClosed(day);
              return (
                <div key={day} className="flex items-center gap-2">
                  <Label className="w-16 text-sm">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Label>
                  {isClosed ? (
                    <div className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-md text-muted-foreground/60">
                      Closed
                    </div>
                  ) : (
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formatInputValue(days[day])}
                      onChange={(e) => handleNumberInput(e.target.value, setDays, day)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1"
                    />
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Sum: {daysSum.toFixed(1)}%</span>
              <Badge variant={daysStatus === 'OK' ? 'default' : 'destructive'} className={daysStatus === 'OK' ? 'bg-success' : ''}>
                {daysStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Split</CardTitle>
            <CardDescription>Weekly intended service mix from Hours tab</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableServices.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">
                No services defined. Please set up your hours of operation first.
              </p>
            ) : (
              <>
                {availableServices.map(service => (
                  <div key={service} className="space-y-2">
                    <Label>{service} (%)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formatInputValue(services[service] || 0)}
                      onChange={(e) => handleNumberInput(e.target.value, setServices, service)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Sum: {serviceSum.toFixed(1)}%</span>
                  <Badge variant={serviceStatus === 'OK' ? 'default' : 'destructive'} className={serviceStatus === 'OK' ? 'bg-success' : ''}>
                    {serviceStatus}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground/60 bg-info/10 p-2 rounded">
                  Services are automatically populated from your Hours of Operation. If a service is closed on a day, it shows as CLOSED in the matrix.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle>Day × Service Matrix</CardTitle>
              <CardDescription>
                Breakdown showing how sales are distributed across days and services. Closed services show CLOSED.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('percentage')}
              >
                %
              </Button>
              <Button
                variant={viewMode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCustomDialog(true)}
              >
                Enter Sales
              </Button>
              {project?.scenarioMode === 'single' ? (
                <Button
                  variant={viewMode === 'scenario1' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('scenario1')}
                >
                  Use Sales in Detailed Break-Even
                </Button>
              ) : (
                <>
                  <Button
                    variant={viewMode === 'scenario1' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('scenario1')}
                  >
                    Scenario 1
                  </Button>
                  <Button
                    variant={viewMode === 'scenario2' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('scenario2')}
                  >
                    Scenario 2
                  </Button>
                  <Button
                    variant={viewMode === 'scenario3' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('scenario3')}
                  >
                    Scenario 3
                  </Button>
                </>
              )}
            </div>
            {viewMode !== 'percentage' && (
              <div className="text-sm">
                <span className="font-semibold">Total {period} Sales: </span>
                <span className="text-lg font-bold text-info">{formatCurrency(getSalesAmount())}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Day</TableHead>
                  {availableServices.map(service => (
                    <TableHead key={service} className="text-right">{service}</TableHead>
                  ))}
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
                  const dayTotal = availableServices.reduce((sum, service) =>
                    sum + (dayServiceMatrix[day]?.[service] || 0), 0
                  );

                  return (
                    <TableRow key={day}>
                      <TableCell className="font-medium">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </TableCell>
                      {availableServices.map(service => {
                        const value = dayServiceMatrix[day]?.[service] || 0;
                        const salesAmount = getSalesAmount();
                        const displayValue = viewMode === 'percentage'
                          ? `${value.toFixed(1)}%`
                          : formatCurrency((salesAmount * value) / 100);
                        return (
                          <TableCell key={service} className="text-right">
                            {value === 0 ? (
                              <span className="text-muted-foreground/60">CLOSED</span>
                            ) : (
                              displayValue
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold">
                        {dayTotal === 0 ? (
                          <span className="text-muted-foreground/60">CLOSED</span>
                        ) : viewMode === 'percentage' ? (
                          `${dayTotal.toFixed(1)}%`
                        ) : (
                          formatCurrency((getSalesAmount() * dayTotal) / 100)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-surface-2 font-semibold">
                  <TableCell>Total</TableCell>
                  {availableServices.map(service => {
                    const serviceTotalPct = Object.values(dayServiceMatrix).reduce((sum, day) =>
                      sum + (day[service] || 0), 0
                    );
                    return (
                      <TableCell key={service} className="text-right">
                        {viewMode === 'percentage'
                          ? `${serviceTotalPct.toFixed(1)}%`
                          : formatCurrency((getSalesAmount() * serviceTotalPct) / 100)
                        }
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    {(() => {
                      const totalPct = Object.values(dayServiceMatrix).reduce((sum, day) =>
                        sum + availableServices.reduce((serviceSum, service) =>
                          serviceSum + (day[service] || 0), 0
                        ), 0
                      );
                      return viewMode === 'percentage'
                        ? `${totalPct.toFixed(1)}%`
                        : formatCurrency((getSalesAmount() * totalPct) / 100);
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Custom Sales Amount</DialogTitle>
            <DialogDescription>
              Enter a {period.toLowerCase()} sales amount to see how it distributes across days and services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-sales">Sales Amount ($)</Label>
              <Input
                id="custom-sales"
                type="text"
                inputMode="decimal"
                value={tempCustomSales}
                onChange={(e) => setTempCustomSales(e.target.value.replace(/[^0-9.]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSalesSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomSalesSubmit}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewMode === 'percentage' && (
        <Card className="border-border bg-surface-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded-full">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sales Amount Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please select a sales amount to continue. Use one of the buttons above the matrix:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• <strong>Enter Sales</strong> - Input a custom sales amount</li>
                  <li>• <strong>Use Sales in Detailed Break-Even</strong> - Use your existing sales projections</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}

      {project && onNavigate && (
        <WalkthroughNavigation
          project={project}
          currentStepNumber={WALKTHROUGH_STEPS.SALES_BREAKUP}
          onNavigate={onNavigate}
          onUpdate={onProjectChange}
          showPrevious={true}
          disabled={viewMode === 'percentage'}
        />
      )}
    </div>
  );
}
