import { HoursVisualizationData, PREP_CLOSE_COLOR } from '@/lib/hoursVisualization/types';
import { formatTime, TimeFormat } from '@/lib/timeUtils';

function decimalToTime(decimal: number): string {
  let hours = Math.floor(decimal);
  if (hours >= 24) hours = hours % 24;
  if (hours < 0) hours = (hours % 24) + 24;

  const minutes = Math.round((decimal - Math.floor(decimal)) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateHoursChartSvg(
  data: HoursVisualizationData,
  mode: 'simple' | 'detailed' = 'detailed',
  timeFormat: TimeFormat = '12h'
): string {
  const { days, summary, serviceColors, globalEarliestStart, overallDuration } = data;

  const rowHeight = 24;
  const dayLabelWidth = 90;
  const timeLabelWidth = 110;
  const chartWidth = 400;
  const marginTop = 30;
  const marginBottom = 40;
  const legendHeight = mode === 'detailed' && Object.keys(summary.serviceBreakdown).length > 0 ? 80 : 0;
  const summaryHeight = mode === 'detailed' ? 100 : 0;

  let detailedHeight = 0;
  if (mode === 'detailed') {
    days.forEach((dayData) => {
      const hasVenueWindows = dayData.venueWindowBounds.length > 0;
      const validShifts = dayData.daySchedule.shifts?.filter((s: any) => s.openTime && s.closeTime) || [];
      const numRows = (hasVenueWindows ? 1 : 0) + validShifts.length;
      detailedHeight += 35 + (numRows * (rowHeight + 6)) + 12;
    });
  }

  const simpleHeight = days.length * (rowHeight + 6);
  const contentHeight = mode === 'detailed' ? detailedHeight : simpleHeight;

  const totalHeight = marginTop + contentHeight + legendHeight + summaryHeight + marginBottom;
  const totalWidth = dayLabelWidth + chartWidth + timeLabelWidth + 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;

  svg += '<defs>';
  svg += '<style>';
  svg += `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
    text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .day-title { font-size: 11px; font-weight: 600; fill: #334155; }
    .day-label { font-size: 10px; font-weight: 500; fill: #334155; }
    .row-label { font-size: 9px; fill: #475569; }
    .time-label { font-size: 9px; fill: #64748b; }
    .shift-time-label { font-size: 8px; fill: #f8fafc; font-weight: 500; }
    .legend-text { font-size: 9px; fill: #475569; }
    .summary-text { font-size: 10px; fill: #334155; }
    .summary-bold { font-weight: 600; }
  `;
  svg += '</style>';
  svg += '</defs>';

  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>`;

  const chartStartX = dayLabelWidth + 20;
  const chartStartY = marginTop;

  if (mode === 'simple') {
    days.forEach((dayData, dayIndex) => {
      const y = chartStartY + dayIndex * (rowHeight + 6);

      svg += `<text x="10" y="${y + rowHeight / 2 + 4}" class="day-label">${escapeXml(dayData.dayLabel)}</text>`;

      svg += `<rect x="${chartStartX}" y="${y}" width="${chartWidth}" height="${rowHeight}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" rx="3"/>`;

      dayData.venueWindowBounds.forEach((windowBounds: any) => {
        const startDec = windowBounds.startDec;
        const endDec = windowBounds.endDec;
        const windowLeft = ((startDec - globalEarliestStart) / overallDuration) * chartWidth;
        const windowWidth = ((endDec - startDec) / overallDuration) * chartWidth;

        svg += `<rect x="${chartStartX + windowLeft}" y="${y}" width="${windowWidth}" height="${rowHeight}" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2" rx="3"/>`;

        const centerX = chartStartX + windowLeft + windowWidth / 2;
        const timeText = `${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`;
        if (windowWidth > 60) {
          svg += `<text x="${centerX}" y="${y + rowHeight / 2 + 4}" class="time-label" text-anchor="middle">${escapeXml(timeText)}</text>`;
        }
      });
    });
  } else {
    let currentY = chartStartY;

    days.forEach((dayData) => {
      const hasVenueWindows = dayData.venueWindowBounds.length > 0;
      const validShifts = dayData.daySchedule.shifts?.filter((s: any) => s.openTime && s.closeTime) || [];

      svg += `<rect x="10" y="${currentY}" width="${totalWidth - 20}" height="${35 + (((hasVenueWindows ? 1 : 0) + validShifts.length) * (rowHeight + 6))}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="6"/>`;

      svg += `<text x="20" y="${currentY + 18}" class="day-title">${escapeXml(dayData.dayLabel)}</text>`;

      let rowY = currentY + 28;

      if (hasVenueWindows) {
        svg += `<text x="30" y="${rowY + rowHeight / 2 + 4}" class="row-label">Venue Hours</text>`;

        svg += `<rect x="${chartStartX}" y="${rowY}" width="${chartWidth}" height="${rowHeight}" fill="#fafafa" stroke="#e2e8f0" stroke-width="1" rx="3"/>`;

        dayData.venueWindowBounds.forEach((windowBounds: any) => {
          const startDec = windowBounds.startDec;
          const endDec = windowBounds.endDec;
          const windowLeft = ((startDec - globalEarliestStart) / overallDuration) * chartWidth;
          const windowWidth = ((endDec - startDec) / overallDuration) * chartWidth;

          svg += `<rect x="${chartStartX + windowLeft}" y="${rowY}" width="${windowWidth}" height="${rowHeight}" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2" rx="3"/>`;

          if (windowWidth > 60) {
            const centerX = chartStartX + windowLeft + windowWidth / 2;
            const timeText = `${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`;
            svg += `<text x="${centerX}" y="${rowY + rowHeight / 2 + 4}" class="time-label" text-anchor="middle" fill="#0369a1">${escapeXml(timeText)}</text>`;
          }
        });

        const venueWindow = dayData.daySchedule.venueWindows?.[0];
        if (venueWindow) {
          const timeText = `${formatTime(venueWindow.openTime, timeFormat)} - ${formatTime(venueWindow.closeTime, timeFormat)}`;
          svg += `<text x="${chartStartX + chartWidth + 10}" y="${rowY + rowHeight / 2 + 4}" class="time-label" text-anchor="start">${escapeXml(timeText)}</text>`;
        }

        rowY += rowHeight + 6;
      }

      validShifts.forEach((shift: any) => {
        const serviceName = shift.serviceName || 'Service';
        const serviceNameCapitalized = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

        svg += `<text x="30" y="${rowY + rowHeight / 2 + 4}" class="row-label">${escapeXml(serviceNameCapitalized)}</text>`;

        svg += `<rect x="${chartStartX}" y="${rowY}" width="${chartWidth}" height="${rowHeight}" fill="#fafafa" stroke="#e2e8f0" stroke-width="1" rx="3"/>`;

        let startDec = (() => {
          const [h, m] = shift.openTime.split(':').map(Number);
          return h + (m || 0) / 60;
        })();

        let endDec = (() => {
          const [h, m] = shift.closeTime.split(':').map(Number);
          return h + (m || 0) / 60;
        })();

        if (endDec < startDec) endDec += 24;

        const serviceLower = serviceName.toLowerCase();
        const color = serviceColors[serviceLower] || '#94a3b8';

        const prepHours = shift.prepHours || 0;
        const closeHours = shift.shutdownHours || 0;

        const prepStartDec = startDec - prepHours;
        const closeEndDec = endDec + closeHours;

        const segments = [];

        if (prepHours > 0) {
          const prepLeft = ((prepStartDec - globalEarliestStart) / overallDuration) * chartWidth;
          const prepWidth = (prepHours / overallDuration) * chartWidth;
          segments.push({
            type: 'prep',
            left: prepLeft,
            width: prepWidth,
            color: PREP_CLOSE_COLOR,
            label: prepWidth > 20 ? 'P' : '',
            borderRadius: 'left',
          });
        }

        const serviceLeft = ((startDec - globalEarliestStart) / overallDuration) * chartWidth;
        const serviceWidth = ((endDec - startDec) / overallDuration) * chartWidth;
        const timeText = `${formatTime(decimalToTime(startDec), timeFormat)} - ${formatTime(decimalToTime(endDec), timeFormat)}`;
        segments.push({
          type: 'service',
          left: serviceLeft,
          width: serviceWidth,
          color: color,
          label: serviceWidth > 60 ? timeText : '',
          borderRadius: prepHours === 0 && closeHours === 0 ? 'both' : prepHours === 0 ? 'left' : closeHours === 0 ? 'right' : 'none',
        });

        if (closeHours > 0) {
          const closeLeft = ((endDec - globalEarliestStart) / overallDuration) * chartWidth;
          const closeWidth = (closeHours / overallDuration) * chartWidth;
          segments.push({
            type: 'close',
            left: closeLeft,
            width: closeWidth,
            color: PREP_CLOSE_COLOR,
            label: closeWidth > 20 ? 'C' : '',
            borderRadius: 'right',
          });
        }

        segments.forEach((segment) => {
          const x = chartStartX + segment.left;

          if (segment.borderRadius === 'both') {
            svg += `<rect x="${x}" y="${rowY}" width="${segment.width}" height="${rowHeight}" fill="${segment.color}" rx="3"/>`;
          } else if (segment.borderRadius === 'left') {
            svg += `<path d="M ${x + 3} ${rowY} L ${x + segment.width} ${rowY} L ${x + segment.width} ${rowY + rowHeight} L ${x + 3} ${rowY + rowHeight} A 3 3 0 0 1 ${x} ${rowY + rowHeight - 3} L ${x} ${rowY + 3} A 3 3 0 0 1 ${x + 3} ${rowY} Z" fill="${segment.color}"/>`;
          } else if (segment.borderRadius === 'right') {
            svg += `<path d="M ${x} ${rowY} L ${x + segment.width - 3} ${rowY} A 3 3 0 0 1 ${x + segment.width} ${rowY + 3} L ${x + segment.width} ${rowY + rowHeight - 3} A 3 3 0 0 1 ${x + segment.width - 3} ${rowY + rowHeight} L ${x} ${rowY + rowHeight} Z" fill="${segment.color}"/>`;
          } else {
            svg += `<rect x="${x}" y="${rowY}" width="${segment.width}" height="${rowHeight}" fill="${segment.color}"/>`;
          }

          if (segment.label && segment.width > 40) {
            const centerX = x + segment.width / 2;
            const textColor = segment.type === 'service' ? '#f8fafc' : '#334155';
            svg += `<text x="${centerX}" y="${rowY + rowHeight / 2 + 4}" class="${segment.type === 'service' ? 'shift-time-label' : 'row-label'}" text-anchor="middle" fill="${textColor}">${escapeXml(segment.label)}</text>`;
          }
        });

        const overallStartTime = prepHours > 0 ? decimalToTime(prepStartDec) : decimalToTime(startDec);
        const overallEndTime = closeHours > 0 ? decimalToTime(closeEndDec) : decimalToTime(endDec);
        const overallTimeText = `${formatTime(overallStartTime, timeFormat)} - ${formatTime(overallEndTime, timeFormat)}`;
        svg += `<text x="${chartStartX + chartWidth + 10}" y="${rowY + rowHeight / 2 + 4}" class="time-label" text-anchor="start">${escapeXml(overallTimeText)}</text>`;

        rowY += rowHeight + 6;
      });

      currentY = rowY + 12;
    });
  }

  const timeLabelsY = marginTop + contentHeight + 20;
  const numTimeLabels = Math.min(8, Math.ceil(overallDuration / 3));
  for (let i = 0; i <= numTimeLabels; i++) {
    const timeDec = globalEarliestStart + (i / numTimeLabels) * overallDuration;
    const x = chartStartX + (i / numTimeLabels) * chartWidth;
    const timeStr = formatTime(decimalToTime(timeDec), timeFormat);
    svg += `<line x1="${x}" y1="${timeLabelsY - 10}" x2="${x}" y2="${timeLabelsY - 5}" stroke="#cbd5e1" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${timeLabelsY}" class="time-label" text-anchor="middle">${escapeXml(timeStr)}</text>`;
  }

  if (mode === 'detailed' && Object.keys(summary.serviceBreakdown).length > 0) {
    const legendY = timeLabelsY + 30;
    svg += `<text x="10" y="${legendY}" class="legend-text" font-weight="600">Legend:</text>`;

    let legendX = 70;
    const legendItemWidth = 120;

    svg += `<rect x="${legendX}" y="${legendY - 12}" width="14" height="14" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2" rx="2"/>`;
    svg += `<text x="${legendX + 20}" y="${legendY}" class="legend-text">Venue Open</text>`;
    legendX += legendItemWidth;

    Object.keys(summary.serviceBreakdown).forEach((service) => {
      const color = serviceColors[service.toLowerCase()] || '#cbd5e1';
      svg += `<rect x="${legendX}" y="${legendY - 12}" width="14" height="14" fill="${color}" rx="2"/>`;
      svg += `<text x="${legendX + 20}" y="${legendY}" class="legend-text">${escapeXml(service.charAt(0).toUpperCase() + service.slice(1))}</text>`;
      legendX += legendItemWidth;
    });

    svg += `<rect x="${legendX}" y="${legendY - 12}" width="14" height="14" fill="${PREP_CLOSE_COLOR}" rx="2"/>`;
    svg += `<text x="${legendX + 20}" y="${legendY}" class="legend-text">Prep/Close</text>`;

    const summaryY = legendY + 40;
    svg += `<text x="10" y="${summaryY}" class="summary-text">`;
    svg += `The business operates <tspan class="summary-bold">${summary.openDaysCount} day${summary.openDaysCount !== 1 ? 's' : ''} per week</tspan>`;
    svg += `</text>`;

    svg += `<text x="10" y="${summaryY + 20}" class="summary-text">`;
    svg += `with approximately <tspan class="summary-bold">${summary.totalTradingHours.toFixed(1)} trading hours</tspan> and `;
    svg += `<tspan class="summary-bold">${summary.totalNonTradingHours.toFixed(1)} non-trading hours</tspan> (prep and close-down) weekly.`;
    svg += `</text>`;
  }

  svg += '</svg>';

  return svg;
}
