import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportData, getViabilityNarrative } from './exportDataBuilder';
import { calculateRequiredSales } from '../calculations';
import { evaluateHourlySalesBenchmark, venueTypeLabel } from '../calculations/hourlyBenchmarks';
import { calculateLocationSuitability } from '../calculations/locationSuitability';
import { formatCurrency } from '@/lib/format';

function pdfParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number = 170,
  lineHeight: number = 6
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line: string) => {
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

export async function exportComprehensivePDF(exportData: ExportData, projectName: string = 'Business Plan'): Promise<void> {
  const doc = new jsPDF();
  const { project, summary, forecast, insights } = exportData;

  let yPos = 20;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MojoBusiness.ai', 105, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(18);
  doc.text('Business Plan Report', 105, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, 105, yPos, { align: 'center' });

  yPos += 8;
  const addressLine = project.location?.address || project.storeTown || '';
  if (addressLine) {
    doc.setFontSize(10);
    doc.text(addressLine, 105, yPos, { align: 'center' });
    yPos += 6;
  }

  yPos += 6;
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });

  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Snapshot', 20, yPos);

  yPos += 10;


  const snapshotData = [
    ['Break-Even Sales', formatCurrency(summary.requiredSalesToBreakEven)],
    ['Sales to Pay Owner', formatCurrency(summary.requiredSalesToPayOwner)],
    ['Total Fixed Costs', formatCurrency(summary.totalFixedCosts)],
    ['Total Fitout Cost', formatCurrency(summary.totalFitoutCost)],
    ['Funding Gap', formatCurrency(Math.abs(summary.fundingGap)) + (summary.fundingGap > 0 ? ' (Shortfall)' : ' (Surplus)')],
    ['Health Rating', summary.healthRating],
  ];

  if (summary.requiredSalesPerTradingHour && summary.requiredSalesPerTradingHour > 0) {
    snapshotData.push([
      'Required Sales per Trading Hour',
      formatCurrency(summary.requiredSalesPerTradingHour)
    ]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: snapshotData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 90 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Viability Assessment', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const narrative = getViabilityNarrative(project, summary);
  yPos = pdfParagraph(doc, narrative, 20, yPos, 170, 6);
  yPos += 8;

  if (summary.requiredSalesPerTradingHour && project.venueType) {
    const bench = evaluateHourlySalesBenchmark(
      project.venueType,
      summary.requiredSalesPerTradingHour
    );

    if (bench) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const benchText = `Required sales per trading hour: ~${formatCurrency(
        summary.requiredSalesPerTradingHour
      )}. For a ${venueTypeLabel(
        bench.venueType
      )} this sits in the "${bench.band.label}" range.`;
      yPos = pdfParagraph(doc, benchText, 20, yPos, 170, 6);
      yPos += 4;

      const benchNoteText = `Benchmark note: ${bench.band.description}`;
      yPos = pdfParagraph(doc, benchNoteText, 20, yPos, 170, 6);
      yPos += 10;
    }
  }

  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Break-Even Scenarios', 20, yPos);
  yPos += 10;

  const scenarios = [
    project.detailedBreakEven.scenario1,
    project.detailedBreakEven.scenario2,
    project.detailedBreakEven.scenario3,
  ];

  const breakEvenData = scenarios.map((scenario, index) => {
    const totalVariable = scenario.variableCogs + scenario.variableLabour + scenario.variableOther;
    const fixedCosts = scenario.rent + scenario.labourMinimumCost + scenario.insurance +
                      scenario.accounting + scenario.marketing + scenario.utilities + scenario.otherFixed;
    const breakEven = calculateRequiredSales(fixedCosts, 0, totalVariable);
    const payOwner = calculateRequiredSales(fixedCosts, scenario.ownersReturn, totalVariable);

    return [
      index === 0 ? 'Scenario 1 (Base)' : `Scenario ${index + 1}`,
      `${totalVariable.toFixed(1)}%`,
      formatCurrency(fixedCosts),
      formatCurrency(breakEven),
      formatCurrency(payOwner),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Scenario', 'Total Variable %', 'Fixed Costs', 'Req. Sales (BE)', 'Req. Sales (Pay Owner)']],
    body: breakEvenData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Owner's return used in all scenarios: ${formatCurrency(project.simpleBreakEven.ownersReturn)} per ${project.period}`, 20, yPos);
  yPos += 5;
  doc.text(`• Fixed costs shown include rent plus any additional fixed expenses`, 20, yPos);

  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Fitout & Financing Scenarios', 20, yPos);
  yPos += 10;

  const fitoutScenarios = [
    project.fitoutFinancing.scenario1,
    project.fitoutFinancing.scenario2,
    project.fitoutFinancing.scenario3,
  ];

  const fitoutData = fitoutScenarios.map((scenario, index) => {
    const totalFitout = scenario.equipment + scenario.furniture + scenario.tech +
                       scenario.stock + scenario.fitout + scenario.signage +
                       (scenario.designFees || 0) + scenario.legal;
    const totalCost = totalFitout + scenario.operatingCapital;
    const availableFunding = scenario.startupCapital + scenario.loanAmount + scenario.equipmentRentalAmount;
    const gap = totalCost - availableFunding;

    return [
      index === 0 ? 'Scenario 1 (Base)' : `Scenario ${index + 1}`,
      formatCurrency(totalCost),
      formatCurrency(scenario.startupCapital),
      formatCurrency(scenario.loanAmount + scenario.equipmentRentalAmount),
      formatCurrency(availableFunding),
      formatCurrency(Math.abs(gap)) + (gap > 0 ? ' (Short)' : ' (Extra)'),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Scenario', 'Total Cost', 'Cash', 'Finance', 'Available', 'Gap']],
    body: fitoutData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (summary.fundingGap > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    const warningText = `⚠ In your selected base scenario, you are short by approximately ${formatCurrency(summary.fundingGap)}. You may need to reduce fitout cost, increase cash contribution, or secure more finance.`;
    const splitWarning = doc.splitTextToSize(warningText, 170);
    doc.text(splitWarning, 20, yPos);
    doc.setTextColor(0, 0, 0);
  }

  doc.addPage();
  yPos = 20;

  if (project.location && project.locationSuitabilityScore !== null && project.locationSuitabilityScore !== undefined) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Location Suitability', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const locationIntro = `Mojo calculates a location suitability score based on rent affordability, catchment strength, visibility, and nearby activity.`;
    yPos = pdfParagraph(doc, locationIntro, 20, yPos, 170, 6);
    yPos += 8;

    const breakdown = calculateLocationSuitability(project);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Score: ${project.locationSuitabilityScore}/100`, 20, yPos);
    yPos += 8;

    const scoreData = [
      ['Financial Suitability', `${breakdown.financial}/25`],
      ['Demand & Catchment', `${breakdown.catchment}/25`],
      ['Access & Visibility', `${breakdown.visibility}/25`],
      ['Surrounding Activity', `${breakdown.activity}/25`],
    ];

    autoTable(doc, {
      startY: yPos,
      body: scoreData,
      theme: 'striped',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { cellWidth: 80 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    if (project.location.address) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Address: ${project.location.address}`, 20, yPos);
      yPos += 6;
    }

    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('12-Month Revenue Forecast', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryMetrics = [
    ['Annual Revenue', formatCurrency(forecast.annualRevenue)],
    ['Annual Surplus', formatCurrency(forecast.annualSurplus)],
    ['Break-Even Month', forecast.breakEvenMonthIndex ? `Month ${forecast.breakEvenMonthIndex}` : 'Not reached in 12 months'],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryMetrics,
    theme: 'plain',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  const forecastData = forecast.months.map(month => [
    month.label,
    formatCurrency(month.revenue),
    formatCurrency(month.totalCosts),
    formatCurrency(month.surplus),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Month', 'Revenue', 'Total Costs', 'Surplus']],
    body: forecastData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Insights & Recommendations', 20, yPos);
  yPos += 8;

  const sortedInsights = [...insights].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const topInsights = sortedInsights.slice(0, 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  topInsights.forEach((insight) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const severityColor = insight.severity === 'critical' ? [220, 38, 38] as [number, number, number] :
                         insight.severity === 'warning' ? [234, 179, 8] as [number, number, number] : [59, 130, 246] as [number, number, number];
    doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`• [${insight.category}] ${insight.title}`, 20, yPos);
    yPos += 5;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const messageSplit = doc.splitTextToSize(insight.message, 170);
    doc.text(messageSplit, 25, yPos);
    yPos += messageSplit.length * 5;

    if (insight.suggestion) {
      doc.setFont('helvetica', 'italic');
      const suggestionText = `Suggestion: ${insight.suggestion}`;
      const suggestionSplit = doc.splitTextToSize(suggestionText, 165);
      doc.text(suggestionSplit, 25, yPos);
      yPos += suggestionSplit.length * 5 + 3;
    }

    yPos += 3;
  });

  doc.save(`${projectName.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`);
}
