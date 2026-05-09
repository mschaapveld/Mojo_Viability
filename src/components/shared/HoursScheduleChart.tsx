import { HoursVisualizationData, PREP_CLOSE_COLOR } from '@/lib/hoursVisualization/types';
import { useState } from 'react';
import { formatTime, TimeFormat } from '@/lib/timeUtils';

interface HoursScheduleChartProps {
  data: HoursVisualizationData;
  timeFormat?: TimeFormat;
  showLegend?: boolean;
  showTotals?: boolean;
  mode?: 'simple' | 'detailed';
  onModeChange?: (mode: 'simple' | 'detailed') => void;
  showModeToggle?: boolean;
  onUpdateShift?: (day: string, shiftId: string, updates: { openTime?: string; closeTime?: string }) => void;
  onUpdateVenueWindow?: (day: string, windowId: string, updates: { openTime?: string; closeTime?: string }) => void;
}

interface DragState {
  type: 'start' | 'end' | 'move';
  targetType: 'shift' | 'venue';
  day: string;
  id: string;
  index: number;
  originalStartDec: number;
  originalEndDec: number;
  startPointerX: number;
  previewStartDec: number;
  previewEndDec: number;
}

function decimalToTime(decimal: number): string {
  let hours = Math.floor(decimal);
  if (hours >= 24) hours = hours % 24;
  if (hours < 0) hours = (hours % 24) + 24;

  const minutes = Math.round((decimal - Math.floor(decimal)) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function snapToInterval(decimal: number, intervalMinutes: number = 15): number {
  const totalMinutes = decimal * 60;
  const snappedMinutes = Math.round(totalMinutes / intervalMinutes) * intervalMinutes;
  return snappedMinutes / 60;
}

function clampTime(decimal: number, min: number = 0, max: number = 24): number {
  return Math.max(min, Math.min(max, decimal));
}

export function HoursScheduleChart({
  data,
  timeFormat = '12h',
  showLegend = true,
  showTotals = true,
  mode: initialMode = 'simple',
  onModeChange,
  showModeToggle = true,
  onUpdateShift,
  onUpdateVenueWindow,
}: HoursScheduleChartProps) {
  const [internalMode, setInternalMode] = useState<'simple' | 'detailed'>(initialMode);
  const mode = onModeChange ? initialMode : internalMode;

  const { days, summary, serviceColors, globalEarliestStart, overallDuration } = data;

  const rowHeight = 32;

  const handleModeChange = (newMode: 'simple' | 'detailed') => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  return (
    <div className="space-y-4">
      {showModeToggle && (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-sm text-muted-foreground">
            {mode === 'simple' ? 'Showing venue opening hours' : 'Showing detailed service shifts'}
          </div>
          <div className="inline-flex gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => handleModeChange('simple')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mode === 'simple'
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => handleModeChange('detailed')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mode === 'detailed'
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      )}

      {mode === 'simple' ? (
        <SimpleView
          days={days}
          globalEarliestStart={globalEarliestStart}
          overallDuration={overallDuration}
          timeFormat={timeFormat}
          rowHeight={rowHeight}
          onUpdateVenueWindow={onUpdateVenueWindow}
        />
      ) : (
        <DetailedView
          days={days}
          globalEarliestStart={globalEarliestStart}
          overallDuration={overallDuration}
          timeFormat={timeFormat}
          serviceColors={serviceColors}
          rowHeight={rowHeight}
          onUpdateShift={onUpdateShift}
          onUpdateVenueWindow={onUpdateVenueWindow}
        />
      )}

      {showLegend && mode === 'detailed' && Object.keys(summary.serviceBreakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' }}></div>
              <span className="text-xs text-muted-foreground">Venue Open</span>
            </div>
            {Object.keys(summary.serviceBreakdown).map((service) => {
              const color = serviceColors[service.toLowerCase()] || '#cbd5e1';
              return (
                <div key={service} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-muted-foreground capitalize">{service}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: PREP_CLOSE_COLOR }}></div>
              <span className="text-xs text-muted-foreground">Prep/Close</span>
            </div>
          </div>
        </div>
      )}

      {showTotals && mode === 'detailed' && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            The business operates <strong>{summary.openDaysCount} day{summary.openDaysCount !== 1 ? 's' : ''} per week</strong>
            {summary.weekdayCount > 0 && summary.weekendCount > 0 && (
              <> ({summary.weekdayCount} weekday{summary.weekdayCount !== 1 ? 's' : ''}, {summary.weekendCount} weekend day{summary.weekendCount !== 1 ? 's' : ''})</>
            )},
            with approximately <strong>{summary.totalTradingHours.toFixed(1)} trading hours</strong> and{' '}
            <strong>{summary.totalNonTradingHours.toFixed(1)} non-trading hours</strong> (prep and close-down) weekly.
          </p>
          {Object.keys(summary.serviceBreakdown).length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {Object.entries(summary.serviceBreakdown).map(([service, hours]) => (
                <div key={service} className="bg-surface-2 rounded p-2 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{service}</p>
                  <p className="text-sm font-semibold text-foreground">{hours.toFixed(1)}h/week</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SimpleViewProps {
  days: any[];
  globalEarliestStart: number;
  overallDuration: number;
  timeFormat: '12h' | '24h';
  rowHeight: number;
  onUpdateVenueWindow?: (day: string, windowId: string, updates: { openTime?: string; closeTime?: string }) => void;
}

function SimpleView({ days, globalEarliestStart, overallDuration, timeFormat, rowHeight, onUpdateVenueWindow }: SimpleViewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredWindow, setHoveredWindow] = useState<{ day: string; id: string } | null>(null);
  const [floatingLabel, setFloatingLabel] = useState<{ x: number; y: number; text: string } | null>(null);

  const isEditable = !!onUpdateVenueWindow;

  const pixelToTimeDelta = (pixelDelta: number, chartWidth: number): number => {
    return (pixelDelta / chartWidth) * overallDuration;
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'start' | 'end' | 'move',
    day: string,
    windowId: string,
    windowIndex: number,
    startDec: number,
    endDec: number
  ) => {
    if (!isEditable) return;

    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setDragState({
      type,
      targetType: 'venue',
      day,
      id: windowId,
      index: windowIndex,
      originalStartDec: startDec,
      originalEndDec: endDec,
      startPointerX: e.clientX,
      previewStartDec: startDec,
      previewEndDec: endDec,
    });
  };

  const handlePointerMove = (e: React.PointerEvent, chartWidth: number) => {
    if (!dragState) return;

    const pixelDelta = e.clientX - dragState.startPointerX;
    const timeDelta = pixelToTimeDelta(pixelDelta, chartWidth);

    let newStartDec = dragState.originalStartDec;
    let newEndDec = dragState.originalEndDec;

    if (dragState.type === 'start') {
      newStartDec = snapToInterval(clampTime(dragState.originalStartDec + timeDelta, 0, dragState.originalEndDec - 0.5));
    } else if (dragState.type === 'end') {
      newEndDec = snapToInterval(clampTime(dragState.originalEndDec + timeDelta, dragState.originalStartDec + 0.5, 24));
    } else if (dragState.type === 'move') {
      const duration = dragState.originalEndDec - dragState.originalStartDec;
      newStartDec = clampTime(dragState.originalStartDec + timeDelta, 0, 24 - duration);
      newEndDec = newStartDec + duration;
      newStartDec = snapToInterval(newStartDec);
      newEndDec = snapToInterval(newEndDec);
    }

    setDragState({
      ...dragState,
      previewStartDec: newStartDec,
      previewEndDec: newEndDec,
    });

    const startTime = decimalToTime(newStartDec);
    const endTime = decimalToTime(newEndDec);
    const labelText = `${formatTime(startTime, timeFormat)} - ${formatTime(endTime, timeFormat)}`;

    setFloatingLabel({ x: e.clientX, y: e.clientY - 40, text: labelText });
  };

  const handlePointerUp = () => {
    if (!dragState || !onUpdateVenueWindow) return;

    const newStartTime = decimalToTime(dragState.previewStartDec);
    const newEndTime = decimalToTime(dragState.previewEndDec);

    onUpdateVenueWindow(dragState.day, dragState.id, {
      openTime: newStartTime,
      closeTime: newEndTime,
    });

    setDragState(null);
    setFloatingLabel(null);
  };

  return (
    <>
      <div className="space-y-3">
        {days.map((dayData) => {
          const hasVenueWindows = dayData.venueWindowBounds.length > 0;

          return (
            <div key={dayData.day} className="space-y-1">
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24 pt-1">{dayData.dayLabel}</span>
                <div className="flex-1">
                  {hasVenueWindows ? (
                    <>
                      <div
                        className="relative"
                        style={{ height: `${rowHeight}px` }}
                        onPointerMove={(e) => {
                          if (dragState?.targetType === 'venue') {
                            const chartElement = e.currentTarget;
                            handlePointerMove(e, chartElement.offsetWidth);
                          }
                        }}
                        onPointerUp={handlePointerUp}
                      >
                        <div className="absolute w-full h-full bg-muted/50 rounded border border-border" />

                        {dayData.venueWindowBounds.map((windowBounds: any, windowIndex: number) => {
                          const venueWindow = dayData.daySchedule.venueWindows?.[windowIndex];
                          if (!venueWindow) return null;

                          const windowId = venueWindow.id || `window-${windowIndex}`;
                          const isDragging = dragState?.targetType === 'venue' && dragState?.day === dayData.day && dragState?.id === windowId;
                          const isHovered = hoveredWindow?.day === dayData.day && hoveredWindow?.id === windowId;

                          let startDec = windowBounds.startDec;
                          let endDec = windowBounds.endDec;

                          if (isDragging && dragState) {
                            startDec = dragState.previewStartDec;
                            endDec = dragState.previewEndDec;
                          }

                          const windowLeft = ((startDec - globalEarliestStart) / overallDuration) * 100;
                          const windowWidth = ((endDec - startDec) / overallDuration) * 100;

                          return (
                            <div
                              key={`venue-${windowIndex}`}
                              className={`absolute rounded flex items-center justify-center ${isEditable ? 'group' : ''}`}
                              style={{
                                left: `${windowLeft}%`,
                                width: `${windowWidth}%`,
                                height: '100%',
                                backgroundColor: '#e0f2fe',
                                border: '2px solid #0ea5e9',
                                zIndex: isDragging ? 20 : 2,
                                cursor: isEditable ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                opacity: isDragging ? 0.8 : 1,
                                boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                              }}
                              data-day={dayData.day}
                              data-window-index={windowIndex}
                              data-bar-type="venue-window"
                              title={`Open: ${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`}
                              onMouseEnter={() => setHoveredWindow({ day: dayData.day, id: windowId })}
                              onMouseLeave={() => setHoveredWindow(null)}
                              onPointerDown={isEditable ? (e) => handlePointerDown(e, 'move', dayData.day, windowId, windowIndex, startDec, endDec) : undefined}
                            >
                              {isEditable && (isHovered || isDragging) && (
                                <>
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                    style={{ backgroundColor: 'rgba(14, 165, 233, 0.4)' }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      handlePointerDown(e, 'start', dayData.day, windowId, windowIndex, startDec, endDec);
                                    }}
                                    title="Drag to adjust open time"
                                  />
                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                    style={{ backgroundColor: 'rgba(14, 165, 233, 0.4)' }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      handlePointerDown(e, 'end', dayData.day, windowId, windowIndex, startDec, endDec);
                                    }}
                                    title="Drag to adjust close time"
                                  />
                                </>
                              )}
                              <span className="text-xs font-medium text-sky-700 px-1">
                                {formatTime(decimalToTime(startDec), timeFormat)} - {formatTime(decimalToTime(endDec), timeFormat)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground/60 italic pt-1">Closed</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {floatingLabel && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground text-xs px-2 py-1 rounded pointer-events-none shadow-lg"
          style={{
            left: `${floatingLabel.x}px`,
            top: `${floatingLabel.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {floatingLabel.text}
        </div>
      )}
    </>
  );
}

interface DetailedViewProps {
  days: any[];
  globalEarliestStart: number;
  overallDuration: number;
  timeFormat: '12h' | '24h';
  serviceColors: Record<string, string>;
  rowHeight: number;
  onUpdateShift?: (day: string, shiftId: string, updates: { openTime?: string; closeTime?: string }) => void;
  onUpdateVenueWindow?: (day: string, windowId: string, updates: { openTime?: string; closeTime?: string }) => void;
}

function DetailedView({ days, globalEarliestStart, overallDuration, timeFormat, serviceColors, rowHeight, onUpdateShift, onUpdateVenueWindow }: DetailedViewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<{ day: string; id: string; type: 'shift' | 'venue' } | null>(null);
  const [floatingLabel, setFloatingLabel] = useState<{ x: number; y: number; text: string } | null>(null);

  const isShiftEditable = !!onUpdateShift;
  const isVenueEditable = !!onUpdateVenueWindow;

  const pixelToTimeDelta = (pixelDelta: number, chartWidth: number): number => {
    return (pixelDelta / chartWidth) * overallDuration;
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'start' | 'end' | 'move',
    targetType: 'shift' | 'venue',
    day: string,
    id: string,
    index: number,
    startDec: number,
    endDec: number
  ) => {
    const isEditable = targetType === 'shift' ? isShiftEditable : isVenueEditable;
    if (!isEditable) return;

    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setDragState({
      type,
      targetType,
      day,
      id,
      index,
      originalStartDec: startDec,
      originalEndDec: endDec,
      startPointerX: e.clientX,
      previewStartDec: startDec,
      previewEndDec: endDec,
    });
  };

  const handlePointerMove = (e: React.PointerEvent, chartWidth: number) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startPointerX;
    const timeDelta = pixelToTimeDelta(deltaX, chartWidth);

    let newStartDec = dragState.originalStartDec;
    let newEndDec = dragState.originalEndDec;

    const MIN_DURATION = 0.5;

    if (dragState.type === 'start') {
      newStartDec = snapToInterval(clampTime(dragState.originalStartDec + timeDelta, 0, 24));
      if (newEndDec - newStartDec < MIN_DURATION) {
        newStartDec = newEndDec - MIN_DURATION;
      }
    } else if (dragState.type === 'end') {
      newEndDec = snapToInterval(clampTime(dragState.originalEndDec + timeDelta, 0, 24));
      if (newEndDec - newStartDec < MIN_DURATION) {
        newEndDec = newStartDec + MIN_DURATION;
      }
    } else if (dragState.type === 'move') {
      const duration = dragState.originalEndDec - dragState.originalStartDec;
      newStartDec = snapToInterval(clampTime(dragState.originalStartDec + timeDelta, 0, 24 - duration));
      newEndDec = newStartDec + duration;
    }

    setDragState({
      ...dragState,
      previewStartDec: newStartDec,
      previewEndDec: newEndDec,
    });

    const labelText =
      dragState.type === 'move'
        ? `${formatTime(decimalToTime(newStartDec), timeFormat)} - ${formatTime(decimalToTime(newEndDec), timeFormat)}`
        : dragState.type === 'start'
        ? `Start: ${formatTime(decimalToTime(newStartDec), timeFormat)}`
        : `Finish: ${formatTime(decimalToTime(newEndDec), timeFormat)}`;

    setFloatingLabel({ x: e.clientX, y: e.clientY - 40, text: labelText });
  };

  const handlePointerUp = () => {
    if (!dragState) return;

    const newStartTime = decimalToTime(dragState.previewStartDec);
    const newEndTime = decimalToTime(dragState.previewEndDec);

    if (dragState.targetType === 'shift' && onUpdateShift) {
      onUpdateShift(dragState.day, dragState.id, {
        openTime: newStartTime,
        closeTime: newEndTime,
      });
    } else if (dragState.targetType === 'venue' && onUpdateVenueWindow) {
      onUpdateVenueWindow(dragState.day, dragState.id, {
        openTime: newStartTime,
        closeTime: newEndTime,
      });
    }

    setDragState(null);
    setFloatingLabel(null);
  };

  return (
    <div className="space-y-4">
      {days.map((dayData) => {
        const hasVenueWindows = dayData.venueWindowBounds.length > 0;
        const hasShifts = dayData.daySchedule.shifts?.some((s: any) => s.openTime && s.closeTime);

        return (
          <div key={dayData.day} className="border border-border rounded-lg p-3">
            <div className="text-sm font-semibold text-muted-foreground mb-3">{dayData.dayLabel}</div>

            <div className="space-y-2">
              {hasVenueWindows && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 flex-shrink-0">Venue Hours</span>
                  <div
                    className="flex-1 relative"
                    style={{ height: `${rowHeight}px` }}
                    onPointerMove={(e) => {
                      if (dragState?.targetType === 'venue') {
                        const chartElement = e.currentTarget;
                        handlePointerMove(e, chartElement.offsetWidth);
                      }
                    }}
                    onPointerUp={handlePointerUp}
                  >
                    <div className="absolute w-full h-full bg-surface-2 rounded border border-border" />

                    {dayData.venueWindowBounds.map((windowBounds: any, windowIndex: number) => {
                      const venueWindow = dayData.daySchedule.venueWindows?.[windowIndex];
                      if (!venueWindow) return null;

                      const windowId = venueWindow.id || `window-${windowIndex}`;
                      const isDragging = dragState?.targetType === 'venue' && dragState?.day === dayData.day && dragState?.id === windowId;
                      const isHovered = hoveredTarget?.type === 'venue' && hoveredTarget?.day === dayData.day && hoveredTarget?.id === windowId;

                      let startDec = windowBounds.startDec;
                      let endDec = windowBounds.endDec;

                      if (isDragging && dragState) {
                        startDec = dragState.previewStartDec;
                        endDec = dragState.previewEndDec;
                      }

                      const windowLeft = ((startDec - globalEarliestStart) / overallDuration) * 100;
                      const windowWidth = ((endDec - startDec) / overallDuration) * 100;

                      return (
                        <div
                          key={`venue-${windowIndex}`}
                          className={`absolute rounded flex items-center justify-center ${isVenueEditable ? 'group' : ''}`}
                          style={{
                            left: `${windowLeft}%`,
                            width: `${windowWidth}%`,
                            height: '100%',
                            backgroundColor: '#e0f2fe',
                            border: '2px solid #0ea5e9',
                            zIndex: isDragging ? 20 : 1,
                            cursor: isVenueEditable ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            opacity: isDragging ? 0.8 : 1,
                            boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                          }}
                          data-day={dayData.day}
                          data-window-index={windowIndex}
                          data-bar-type="venue-window"
                          title={`Venue Open: ${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`}
                          onMouseEnter={() => setHoveredTarget({ day: dayData.day, id: windowId, type: 'venue' })}
                          onMouseLeave={() => setHoveredTarget(null)}
                          onPointerDown={isVenueEditable ? (e) => handlePointerDown(e, 'move', 'venue', dayData.day, windowId, windowIndex, startDec, endDec) : undefined}
                        >
                          {isVenueEditable && (isHovered || isDragging) && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                style={{ backgroundColor: 'rgba(14, 165, 233, 0.4)' }}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  handlePointerDown(e, 'start', 'venue', dayData.day, windowId, windowIndex, startDec, endDec);
                                }}
                                title="Drag to adjust open time"
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                style={{ backgroundColor: 'rgba(14, 165, 233, 0.4)' }}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  handlePointerDown(e, 'end', 'venue', dayData.day, windowId, windowIndex, startDec, endDec);
                                }}
                                title="Drag to adjust close time"
                              />
                            </>
                          )}
                          <span className="text-xs font-medium text-sky-700 px-1">
                            {formatTime(decimalToTime(startDec), timeFormat)} - {formatTime(decimalToTime(endDec), timeFormat)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground w-40 flex-shrink-0 text-right">
                    {dayData.venueWindowBounds.map((_: any, idx: number) => {
                      const openTime = dayData.daySchedule.venueWindows?.[idx]?.openTime || '';
                      const closeTime = dayData.daySchedule.venueWindows?.[idx]?.closeTime || '';
                      return (
                        <div key={idx}>
                          {formatTime(openTime, timeFormat)} - {formatTime(closeTime, timeFormat)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasShifts ? (
                dayData.daySchedule.shifts
                  .filter((shift: any) => shift.openTime && shift.closeTime)
                  .map((shift: any, shiftIndex: number) => {
                    const isDragging = dragState?.targetType === 'shift' && dragState?.day === dayData.day && dragState?.id === shift.id;
                    const isHovered = hoveredTarget?.type === 'shift' && hoveredTarget?.day === dayData.day && hoveredTarget?.id === shift.id;

                    let startDec = shift.openTime ? (() => {
                      const [h, m] = shift.openTime.split(':').map(Number);
                      return h + (m || 0) / 60;
                    })() : 0;

                    let endDec = shift.closeTime ? (() => {
                      const [h, m] = shift.closeTime.split(':').map(Number);
                      return h + (m || 0) / 60;
                    })() : 0;

                    if (endDec < startDec) endDec += 24;

                    if (isDragging && dragState) {
                      startDec = dragState.previewStartDec;
                      endDec = dragState.previewEndDec;
                    }

                    const serviceLower = shift.serviceName.toLowerCase();
                    const color = serviceColors[serviceLower] || '#94a3b8';

                    const prepHours = shift.prepHours || 0;
                    const closeHours = shift.shutdownHours || 0;

                    const prepStartDec = startDec - prepHours;
                    const closeEndDec = endDec + closeHours;

                    const segments = [];

                    if (prepHours > 0) {
                      const prepLeft = ((prepStartDec - globalEarliestStart) / overallDuration) * 100;
                      const prepWidth = (prepHours / overallDuration) * 100;
                      const prepStartTime = decimalToTime(prepStartDec);
                      const prepEndTime = decimalToTime(startDec);

                      segments.push({
                        type: 'prep',
                        left: prepLeft,
                        width: prepWidth,
                        backgroundColor: PREP_CLOSE_COLOR,
                        tooltip: `Prep: ${shift.serviceName} | ${formatTime(prepStartTime, timeFormat)} - ${formatTime(prepEndTime, timeFormat)}`,
                        label: prepWidth > 8 ? 'P' : '',
                      });
                    }

                    const serviceLeft = ((startDec - globalEarliestStart) / overallDuration) * 100;
                    const serviceWidth = ((endDec - startDec) / overallDuration) * 100;
                    segments.push({
                      type: 'service',
                      left: serviceLeft,
                      width: serviceWidth,
                      backgroundColor: color,
                      tooltip: `Service: ${shift.serviceName} | ${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`,
                      label: `${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`,
                    });

                    if (closeHours > 0) {
                      const closeLeft = ((endDec - globalEarliestStart) / overallDuration) * 100;
                      const closeWidth = (closeHours / overallDuration) * 100;
                      const closeStartTime = decimalToTime(endDec);
                      const closeEndTime = decimalToTime(closeEndDec);

                      segments.push({
                        type: 'close',
                        left: closeLeft,
                        width: closeWidth,
                        backgroundColor: PREP_CLOSE_COLOR,
                        tooltip: `Close-down: ${shift.serviceName} | ${formatTime(closeStartTime, timeFormat)} - ${formatTime(closeEndTime, timeFormat)}`,
                        label: closeWidth > 8 ? 'C' : '',
                      });
                    }

                    const overallStartTime = prepHours > 0 ? decimalToTime(prepStartDec) : decimalToTime(startDec);
                    const overallEndTime = closeHours > 0 ? decimalToTime(closeEndDec) : decimalToTime(endDec);

                    return (
                      <div key={`shift-${shiftIndex}`} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-32 flex-shrink-0 capitalize">{shift.serviceName}</span>
                        <div
                          className="flex-1 relative"
                          style={{ height: `${rowHeight}px` }}
                          onPointerMove={(e) => {
                            if (isDragging) {
                              const chartElement = e.currentTarget;
                              handlePointerMove(e, chartElement.offsetWidth);
                            }
                          }}
                          onPointerUp={handlePointerUp}
                        >
                          <div className="absolute w-full h-full bg-surface-2 rounded border border-border" />

                          {segments.map((segment, segIndex) => {
                            const isServiceSegment = segment.type === 'service';

                            return (
                              <div
                                key={`segment-${segIndex}`}
                                className={`absolute flex items-center justify-center ${isShiftEditable && isServiceSegment ? 'group' : ''}`}
                                style={{
                                  left: `${segment.left}%`,
                                  width: `${segment.width}%`,
                                  height: '100%',
                                  backgroundColor: segment.backgroundColor,
                                  zIndex: isDragging ? 20 : 10,
                                  borderRadius: segIndex === 0 ? '0.25rem 0 0 0.25rem' : segIndex === segments.length - 1 ? '0 0.25rem 0.25rem 0' : '0',
                                  cursor: isShiftEditable && isServiceSegment ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                  opacity: isDragging ? 0.8 : 1,
                                  boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                }}
                                data-day={dayData.day}
                                data-shift-id={shift.id}
                                data-shift-index={shiftIndex}
                                data-bar-type={segment.type}
                                title={segment.tooltip}
                                onMouseEnter={() => isServiceSegment && setHoveredTarget({ day: dayData.day, id: shift.id, type: 'shift' })}
                                onMouseLeave={() => isServiceSegment && setHoveredTarget(null)}
                                onPointerDown={isShiftEditable && isServiceSegment ? (e) => handlePointerDown(e, 'move', 'shift', dayData.day, shift.id, shiftIndex, startDec, endDec) : undefined}
                              >
                                {isShiftEditable && isServiceSegment && (isHovered || isDragging) && (
                                  <>
                                    <div
                                      className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        handlePointerDown(e, 'start', 'shift', dayData.day, shift.id, shiftIndex, startDec, endDec);
                                      }}
                                      title="Drag to adjust start time"
                                    />
                                    <div
                                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-30"
                                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        handlePointerDown(e, 'end', 'shift', dayData.day, shift.id, shiftIndex, startDec, endDec);
                                      }}
                                      title="Drag to adjust end time"
                                    />
                                  </>
                                )}
                                <span className={`text-xs font-medium px-1 truncate ${segment.type === 'service' ? 'text-white' : 'text-muted-foreground'}`}>
                                  {segment.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground w-40 flex-shrink-0 text-right">
                          {formatTime(overallStartTime, timeFormat)} - {formatTime(overallEndTime, timeFormat)}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-sm text-muted-foreground/60 italic text-center py-4">
                  No service shifts added (optional)
                </div>
              )}
            </div>
          </div>
        );
      })}

      {floatingLabel && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            left: `${floatingLabel.x}px`,
            top: `${floatingLabel.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {floatingLabel.text}
        </div>
      )}
    </div>
  );
}
