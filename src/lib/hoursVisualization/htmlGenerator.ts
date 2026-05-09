import { HoursVisualizationData, PREP_CLOSE_COLOR } from './types';
import { formatTime, TimeFormat } from '../timeUtils';

function formatTimeHtml(time: string, format: TimeFormat = '12h'): string {
  return formatTime(time, format);
}

function generateSimpleVisualization(data: HoursVisualizationData, timeFormat: TimeFormat): string {
  const { days, summary, globalEarliestStart, overallDuration } = data;
  const rowHeight = 24;

  const timelineHtml = `
    <div style="margin-bottom: 16px;">
      ${days.map((dayData) => {
        const { dayLabel, venueWindowBounds, daySchedule } = dayData;

        return `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 14px; font-weight: 500; color: #334155; width: 100px;">${dayLabel}</span>
              <div style="flex: 1; position: relative; height: ${rowHeight}px;">
                <div style="position: absolute; width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0;"></div>

                ${venueWindowBounds.map((window) => {
                  const windowLeft = ((window.startDec - globalEarliestStart) / overallDuration) * 100;
                  const windowWidth = ((window.endDec - window.startDec) / overallDuration) * 100;
                  return `<div style="position: absolute; background-color: #3b82f6; left: ${windowLeft}%; width: ${windowWidth}%; height: 100%; z-index: 2; border-radius: 2px;"></div>`;
                }).join('')}
              </div>
              ${venueWindowBounds.length > 0 ? `
                <div style="font-size: 12px; color: #64748b; margin-left: 12px; flex-shrink: 0;">
                  ${venueWindowBounds.map((_, idx) => {
                    const openTime = daySchedule.venueWindows?.[idx]?.openTime || '';
                    const closeTime = daySchedule.venueWindows?.[idx]?.closeTime || '';
                    return `<div>${formatTimeHtml(openTime, timeFormat)} - ${formatTimeHtml(closeTime, timeFormat)}</div>`;
                  }).join('')}
                </div>
              ` : `
                <div style="font-size: 12px; color: #94a3b8; margin-left: 12px; flex-shrink: 0; font-style: italic;">
                  Closed
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
        <strong>Weekly Operating Hours:</strong> ${summary.totalTradingHours.toFixed(1)} trading hours, ${summary.totalNonTradingHours.toFixed(1)} prep/close hours
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        ${Object.entries(summary.serviceBreakdown).map(([service, hours]) => `
          <div style="font-size: 12px; color: #64748b; text-transform: capitalize;">
            ${service}: ${hours.toFixed(1)}h/week
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return timelineHtml;
}

export function generateHoursVisualizationHtml(
  data: HoursVisualizationData,
  timeFormat: TimeFormat = '12h',
  mode: 'simple' | 'detailed' = 'detailed'
): string {
  const { days, summary, serviceColors, globalEarliestStart, overallDuration } = data;

  const rowHeight = 24;
  const stackGap = 1;

  if (mode === 'simple') {
    return generateSimpleVisualization(data, timeFormat);
  }

  const timelineHtml = `
    <div style="margin-bottom: 16px;">
      ${days.map((dayData) => {
        return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 14px; font-weight: 500; color: #334155; width: 100px;">${dayData.dayLabel}</span>
              <div style="flex: 1; position: relative; height: ${rowHeight}px;">
                <div style="position: absolute; width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0;"></div>

                ${dayData.venueWindowBounds.map((window) => {
                  const windowLeft = ((window.startDec - globalEarliestStart) / overallDuration) * 100;
                  const windowWidth = ((window.endDec - window.startDec) / overallDuration) * 100;
                  return `<div style="position: absolute; background-color: #e0f2fe; border: 1px solid #0ea5e9; opacity: 0.3; left: ${windowLeft}%; width: ${windowWidth}%; height: 100%; z-index: 1; border-radius: 2px;"></div>`;
                }).join('')}

                ${dayData.segments.map((segment) => {
                  const segmentLeft = ((segment.startDec - globalEarliestStart) / overallDuration) * 100;
                  const segmentWidth = ((segment.endDec - segment.startDec) / overallDuration) * 100;
                  const shiftCount = segment.shifts.length;
                  const barHeightInSegment = shiftCount > 1
                    ? (rowHeight - (shiftCount - 1) * stackGap) / shiftCount
                    : rowHeight;

                  return segment.shifts.map((swb, stackIndex) => {
                    const { shift, startDec, endDec } = swb;
                    const serviceLower = shift.serviceName.toLowerCase();
                    const color = serviceColors[serviceLower] || '#94a3b8';

                    const isInPrepPhase = segment.endDec <= startDec;
                    const isInShutdownPhase = segment.startDec >= endDec;

                    let barColor = color;
                    let barOpacity = '1';
                    let barZIndex = 10 + stackIndex;
                    let tooltipText = `${shift.serviceName}: ${shift.openTime} - ${shift.closeTime}`;

                    if (isInPrepPhase) {
                      barColor = PREP_CLOSE_COLOR;
                      barOpacity = '0.6';
                      barZIndex = 5 + stackIndex;
                      tooltipText = `${shift.serviceName} - Prep`;
                    } else if (isInShutdownPhase) {
                      barColor = PREP_CLOSE_COLOR;
                      barOpacity = '0.6';
                      barZIndex = 5 + stackIndex;
                      tooltipText = `${shift.serviceName} - Close`;
                    }

                    const stackTop = stackIndex * (barHeightInSegment + stackGap);

                    return `<div style="position: absolute; background-color: ${barColor}; opacity: ${barOpacity}; left: ${segmentLeft}%; width: ${segmentWidth}%; top: ${stackTop}px; height: ${barHeightInSegment}px; z-index: ${barZIndex}; border-radius: 2px;" title="${tooltipText}"></div>`;
                  }).join('');
                }).join('')}
              </div>
              ${dayData.venueWindowBounds.length > 0 ? `
                <div style="font-size: 12px; color: #64748b; margin-left: 12px; flex-shrink: 0;">
                  ${dayData.venueWindowBounds.map((_, idx) => {
                    const openTime = dayData.daySchedule.venueWindows?.[idx]?.openTime || '';
                    const closeTime = dayData.daySchedule.venueWindows?.[idx]?.closeTime || '';
                    return `<div>${formatTimeHtml(openTime, timeFormat)} - ${formatTimeHtml(closeTime, timeFormat)}</div>`;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 8px;">Legend</p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        ${Object.keys(summary.serviceBreakdown).map(service => `
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 16px; height: 16px; border-radius: 2px; background-color: ${serviceColors[service.toLowerCase()] || '#cbd5e1'};"></div>
            <span style="font-size: 12px; color: #64748b; text-transform: capitalize;">${service}</span>
          </div>
        `).join('')}
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; border-radius: 2px; background-color: ${PREP_CLOSE_COLOR}; opacity: 0.6;"></div>
          <span style="font-size: 12px; color: #64748b;">Prep/Close</span>
        </div>
      </div>
    </div>
  `;

  return timelineHtml;
}

export function generateHoursNarrative(data: HoursVisualizationData): string {
  const { summary } = data;

  let narrative = `
    <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">
      The business operates ${summary.openDaysCount} day${summary.openDaysCount !== 1 ? 's' : ''} per week${
        summary.weekdayCount > 0 && summary.weekendCount > 0
          ? ` (${summary.weekdayCount} weekday${summary.weekdayCount !== 1 ? 's' : ''}, ${summary.weekendCount} weekend day${summary.weekendCount !== 1 ? 's' : ''})`
          : ''
      },
      with approximately <strong>${summary.totalTradingHours.toFixed(1)} trading hours</strong> and
      <strong>${summary.totalNonTradingHours.toFixed(1)} non-trading hours</strong> (prep and close-down) weekly.
    </p>
  `;

  if (Object.keys(summary.serviceBreakdown).length > 0) {
    narrative += `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
        ${Object.entries(summary.serviceBreakdown).map(([service, hours]) => `
          <div style="background-color: #f8fafc; border-radius: 4px; padding: 8px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; text-transform: capitalize;">${service}</p>
            <p style="font-size: 14px; font-weight: 600; color: #0f172a;">${hours.toFixed(1)}h/week</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  narrative += `
    <p style="font-size: 12px; color: #64748b;">
      This schedule accommodates proper pre-service preparation and post-service close-down,
      ensuring quality service delivery and operational efficiency.
    </p>
  `;

  return narrative;
}
