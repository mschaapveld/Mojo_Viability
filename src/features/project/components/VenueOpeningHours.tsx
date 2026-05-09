import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { parseTimeInput, formatTime, TimeFormat } from '@/lib/timeUtils';
import { VenueDayHours, VenueOpeningWindow } from '@/lib/types/projectTypes';

interface VenueOpeningHoursData {
  monday: VenueDayHours;
  tuesday: VenueDayHours;
  wednesday: VenueDayHours;
  thursday: VenueDayHours;
  friday: VenueDayHours;
  saturday: VenueDayHours;
  sunday: VenueDayHours;
}

interface VenueOpeningHoursProps {
  data: VenueOpeningHoursData;
  onUpdate: (data: VenueOpeningHoursData) => void;
  timeFormat: TimeFormat;
  onUpdateTimeFormat?: (format: TimeFormat) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function validateWindows(windows: VenueOpeningWindow[]): { valid: boolean; error?: string } {
  const validWindows = windows.filter(w => w.openTime && w.closeTime);

  if (validWindows.length === 0) {
    return { valid: true };
  }

  for (const window of validWindows) {
    const openMinutes = timeToMinutes(window.openTime);
    let closeMinutes = timeToMinutes(window.closeTime);

    if (closeMinutes < openMinutes) {
      closeMinutes += 24 * 60;
    }

    if (closeMinutes <= openMinutes) {
      return { valid: false, error: 'Close time must be after open time' };
    }
  }

  const sortedWindows = [...validWindows].sort((a, b) =>
    timeToMinutes(a.openTime) - timeToMinutes(b.openTime)
  );

  for (let i = 0; i < sortedWindows.length - 1; i++) {
    const currentEnd = timeToMinutes(sortedWindows[i].closeTime);
    const nextStart = timeToMinutes(sortedWindows[i + 1].openTime);

    if (currentEnd > nextStart) {
      return { valid: false, error: 'Opening windows cannot overlap' };
    }
  }

  return { valid: true };
}

export function VenueOpeningHours({ data, onUpdate, timeFormat, onUpdateTimeFormat }: VenueOpeningHoursProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const toggleDay = (day: keyof VenueOpeningHoursData, isOpen: boolean) => {
    const dayData = data[day];

    if (isOpen && dayData.windows.length === 0) {
      onUpdate({
        ...data,
        [day]: {
          isOpen: true,
          windows: [{
            id: crypto.randomUUID(),
            openTime: '',
            closeTime: '',
          }],
        },
      });
    } else {
      onUpdate({
        ...data,
        [day]: {
          ...dayData,
          isOpen,
        },
      });
    }
  };

  const addWindow = (day: keyof VenueOpeningHoursData) => {
    const newWindow: VenueOpeningWindow = {
      id: crypto.randomUUID(),
      openTime: '',
      closeTime: '',
    };

    onUpdate({
      ...data,
      [day]: {
        ...data[day],
        windows: [...data[day].windows, newWindow],
      },
    });
  };

  const removeWindow = (day: keyof VenueOpeningHoursData, windowId: string) => {
    onUpdate({
      ...data,
      [day]: {
        ...data[day],
        windows: data[day].windows.filter(w => w.id !== windowId),
      },
    });
  };

  const updateWindow = (day: keyof VenueOpeningHoursData, windowId: string, updates: Partial<VenueOpeningWindow>) => {
    const updatedWindows = data[day].windows.map(w =>
      w.id === windowId ? { ...w, ...updates } : w
    );

    const sortedWindows = updatedWindows.sort((a, b) => {
      if (!a.openTime) return 1;
      if (!b.openTime) return -1;
      return timeToMinutes(a.openTime) - timeToMinutes(b.openTime);
    });

    onUpdate({
      ...data,
      [day]: {
        ...data[day],
        windows: sortedWindows,
      },
    });
  };

  useEffect(() => {
    const errors: Record<string, string> = {};
    DAYS.forEach(day => {
      if (data[day].isOpen) {
        const validation = validateWindows(data[day].windows);
        if (!validation.valid && validation.error) {
          errors[day] = validation.error;
        }
      }
    });
    setValidationErrors(errors);
  }, [data]);

  return (
    <Card>
      <CardHeader className="text-left">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Venue Opening Hours</CardTitle>
            <CardDescription>
              Define when your venue is open to customers.
              <br />
              You can add multiple opening windows per day for split shifts.
            </CardDescription>
          </div>
          {onUpdateTimeFormat && (
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground">Time Format:</Label>
              <div className="inline-flex gap-1 bg-muted p-1 rounded-full">
                <button
                  onClick={() => onUpdateTimeFormat('12h')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    timeFormat === '12h'
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  12-hour
                </button>
                <button
                  onClick={() => onUpdateTimeFormat('24h')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    timeFormat === '24h'
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  24-hour
                </button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map((day, index) => (
            <DayOpeningHours
              key={day}
              day={day}
              label={DAY_LABELS[index]}
              dayData={data[day]}
              timeFormat={timeFormat}
              error={validationErrors[day]}
              onToggle={(isOpen) => toggleDay(day, isOpen)}
              onAddWindow={() => addWindow(day)}
              onRemoveWindow={(id) => removeWindow(day, id)}
              onUpdateWindow={(id, updates) => updateWindow(day, id, updates)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DayOpeningHoursProps {
  day: string;
  label: string;
  dayData: VenueDayHours;
  timeFormat: TimeFormat;
  error?: string;
  onToggle: (isOpen: boolean) => void;
  onAddWindow: () => void;
  onRemoveWindow: (id: string) => void;
  onUpdateWindow: (id: string, updates: Partial<VenueOpeningWindow>) => void;
}

function DayOpeningHours({
  label,
  dayData,
  timeFormat,
  error,
  onToggle,
  onAddWindow,
  onRemoveWindow,
  onUpdateWindow,
}: DayOpeningHoursProps) {
  return (
    <Card className={error ? 'border-destructive/30 bg-destructive/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {dayData.isOpen ? 'Open' : 'Closed'}
            </span>
            <Switch
              checked={dayData.isOpen}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!dayData.isOpen ? (
          <div className="text-center py-6 text-muted-foreground">Closed</div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {dayData.windows.map((window) => (
              <WindowRow
                key={window.id}
                window={window}
                timeFormat={timeFormat}
                canRemove={dayData.windows.length > 1}
                onUpdate={(updates) => onUpdateWindow(window.id, updates)}
                onRemove={() => onRemoveWindow(window.id)}
              />
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={onAddWindow}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add opening window
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface WindowRowProps {
  window: VenueOpeningWindow;
  timeFormat: TimeFormat;
  canRemove: boolean;
  onUpdate: (updates: Partial<VenueOpeningWindow>) => void;
  onRemove: () => void;
}

function WindowRow({
  window,
  timeFormat,
  canRemove,
  onUpdate,
  onRemove,
}: WindowRowProps) {
  const [openTimeInput, setOpenTimeInput] = useState(
    window.openTime ? formatTime(window.openTime, timeFormat) : ''
  );
  const [closeTimeInput, setCloseTimeInput] = useState(
    window.closeTime ? formatTime(window.closeTime, timeFormat) : ''
  );

  useEffect(() => {
    setOpenTimeInput(window.openTime ? formatTime(window.openTime, timeFormat) : '');
    setCloseTimeInput(window.closeTime ? formatTime(window.closeTime, timeFormat) : '');
  }, [window.openTime, window.closeTime, timeFormat]);

  const handleOpenTimeBlur = () => {
    const parsed = parseTimeInput(openTimeInput);
    if (parsed) {
      onUpdate({ openTime: parsed });
      setOpenTimeInput(formatTime(parsed, timeFormat));
    } else if (openTimeInput) {
      setOpenTimeInput(window.openTime ? formatTime(window.openTime, timeFormat) : '');
    }
  };

  const handleCloseTimeBlur = () => {
    const parsed = parseTimeInput(closeTimeInput);
    if (parsed) {
      onUpdate({ closeTime: parsed });
      setCloseTimeInput(formatTime(parsed, timeFormat));
    } else if (closeTimeInput) {
      setCloseTimeInput(window.closeTime ? formatTime(window.closeTime, timeFormat) : '');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          value={openTimeInput}
          onChange={(e) => setOpenTimeInput(e.target.value)}
          onBlur={handleOpenTimeBlur}
          placeholder="e.g. 8am"
          className="h-8 text-sm"
        />
        <Input
          value={closeTimeInput}
          onChange={(e) => setCloseTimeInput(e.target.value)}
          onBlur={handleCloseTimeBlur}
          placeholder="e.g. 5pm"
          className="h-8 text-sm"
        />
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
