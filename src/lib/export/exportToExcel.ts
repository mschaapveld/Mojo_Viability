import ExcelJS from 'exceljs';
import { ExportData, getViabilityNarrative, getAnnualExpectedSales } from './exportDataBuilder';
import { calculateRequiredSales } from '../calculations';
import { formatCurrency } from '@/lib/format';

export async function exportComprehensiveExcel(exportData: ExportData, projectName: string = 'Business Plan'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const { project, summary, forecast, insights } = exportData;


  const sheet1 = workbook.addWorksheet('Summary');

  sheet1.columns = [
    { width: 35 },
    { width: 25 },
  ];

  sheet1.mergeCells('A1:B1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = 'MojoBusiness.ai - Business Plan Summary';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  sheet1.getCell('A3').value = 'Project Name:';
  sheet1.getCell('A3').font = { bold: true };
  sheet1.getCell('B3').value = projectName;

  sheet1.getCell('A4').value = 'Business Address:';
  sheet1.getCell('A4').font = { bold: true };
  sheet1.getCell('B4').value = project.location?.address || project.storeTown || '';

  sheet1.getCell('A5').value = 'Generated:';
  sheet1.getCell('A5').font = { bold: true };
  sheet1.getCell('B5').value = new Date().toLocaleDateString();

  sheet1.getCell('A6').value = 'Period:';
  sheet1.getCell('A6').font = { bold: true };
  sheet1.getCell('B6').value = project.period;

  const annualSales = getAnnualExpectedSales(project, summary);
  sheet1.getCell('A7').value = 'Expected Sales (Entered):';
  sheet1.getCell('A7').font = { bold: true };
  sheet1.getCell('B7').value = formatCurrency(project.simpleBreakEven.enteredSales);

  sheet1.getCell('A8').value = 'Annual Expected Sales:';
  sheet1.getCell('A8').font = { bold: true };
  sheet1.getCell('B8').value = formatCurrency(annualSales);

  sheet1.getCell('A10').value = 'Business Snapshot';
  sheet1.getCell('A10').font = { bold: true, size: 14 };

  const snapshotData = [
    ['Break-Even Sales', formatCurrency(summary.requiredSalesToBreakEven)],
    ['Sales to Pay Owner', formatCurrency(summary.requiredSalesToPayOwner)],
    ['Total Fixed Costs', formatCurrency(summary.totalFixedCosts)],
    ['Total Fitout Cost', formatCurrency(summary.totalFitoutCost)],
    ['Funding Gap', formatCurrency(Math.abs(summary.fundingGap)) + (summary.fundingGap > 0 ? ' (Shortfall)' : ' (Surplus)')],
    ['Health Rating', summary.healthRating],
  ];

  snapshotData.forEach((row, index) => {
    const rowNum = 11 + index;
    sheet1.getCell(`A${rowNum}`).value = row[0];
    sheet1.getCell(`A${rowNum}`).font = { bold: true };
    sheet1.getCell(`B${rowNum}`).value = row[1];
  });

  sheet1.getCell('A18').value = 'Viability Assessment:';
  sheet1.getCell('A18').font = { bold: true, size: 12 };

  sheet1.mergeCells('A19:B21');
  const narrativeCell = sheet1.getCell('A19');
  narrativeCell.value = getViabilityNarrative(project, summary);
  narrativeCell.alignment = { wrapText: true, vertical: 'top' };
  narrativeCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  const sheet2 = workbook.addWorksheet('Break-Even Scenarios');

  sheet2.columns = [
    { width: 25 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
    { width: 22 },
  ];

  sheet2.mergeCells('A1:E1');
  const sheet2Title = sheet2.getCell('A1');
  sheet2Title.value = 'Detailed Break-Even Scenarios';
  sheet2Title.font = { bold: true, size: 14 };
  sheet2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet2Title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  const sheet2Header = sheet2.getRow(3);
  sheet2Header.values = ['Scenario', 'Total Variable %', 'Fixed Costs', 'Req. Sales (BE)', 'Req. Sales (Pay Owner)'];
  sheet2Header.font = { bold: true };
  sheet2Header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' }
  };

  const scenarios = [
    project.detailedBreakEven.scenario1,
    project.detailedBreakEven.scenario2,
    project.detailedBreakEven.scenario3,
  ];

  scenarios.forEach((scenario, index) => {
    const rowNum = 4 + index;
    const totalVariable = scenario.variableCogs + scenario.variableLabour + scenario.variableOther;
    const fixedCosts = scenario.rent + scenario.labourMinimumCost + scenario.insurance +
                      scenario.accounting + scenario.marketing + scenario.utilities + scenario.otherFixed;
    const breakEven = calculateRequiredSales(fixedCosts, 0, totalVariable);
    const payOwner = calculateRequiredSales(fixedCosts, scenario.ownersReturn, totalVariable);

    const row = sheet2.getRow(rowNum);
    row.values = [
      index === 0 ? 'Scenario 1 (Base)' : `Scenario ${index + 1}`,
      `${totalVariable.toFixed(1)}%`,
      formatCurrency(fixedCosts),
      formatCurrency(breakEven),
      formatCurrency(payOwner),
    ];
  });

  const sheet3 = workbook.addWorksheet('Fitout & Financing');

  sheet3.columns = [
    { width: 25 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  sheet3.mergeCells('A1:H1');
  const sheet3Title = sheet3.getCell('A1');
  sheet3Title.value = 'Fitout & Financing Scenarios';
  sheet3Title.font = { bold: true, size: 14 };
  sheet3Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet3Title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  const sheet3Header = sheet3.getRow(3);
  sheet3Header.values = ['Scenario', 'Total Fitout', 'Working Capital', 'Cash Contrib.', 'Loan', 'Rental', 'Available', 'Gap'];
  sheet3Header.font = { bold: true };
  sheet3Header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' }
  };

  const fitoutScenarios = [
    project.fitoutFinancing.scenario1,
    project.fitoutFinancing.scenario2,
    project.fitoutFinancing.scenario3,
  ];

  fitoutScenarios.forEach((scenario, index) => {
    const rowNum = 4 + index;
    const totalFitout = scenario.equipment + scenario.furniture + scenario.tech +
                       scenario.stock + scenario.fitout + scenario.signage +
                       (scenario.designFees || 0) + scenario.legal;
    const totalCost = totalFitout + scenario.operatingCapital;
    const availableFunding = scenario.startupCapital + scenario.loanAmount + scenario.equipmentRentalAmount;
    const gap = totalCost - availableFunding;

    const row = sheet3.getRow(rowNum);
    row.values = [
      index === 0 ? 'Scenario 1 (Base)' : `Scenario ${index + 1}`,
      formatCurrency(totalFitout),
      formatCurrency(scenario.operatingCapital),
      formatCurrency(scenario.startupCapital),
      formatCurrency(scenario.loanAmount),
      formatCurrency(scenario.equipmentRentalAmount),
      formatCurrency(availableFunding),
      formatCurrency(gap),
    ];

    if (gap > 0) {
      row.getCell(8).font = { color: { argb: 'FFDC2626' } };
    } else {
      row.getCell(8).font = { color: { argb: 'FF16A34A' } };
    }
  });

  const sheet4 = workbook.addWorksheet('12-Month Forecast');

  sheet4.columns = [
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  sheet4.mergeCells('A1:D1');
  const sheet4Title = sheet4.getCell('A1');
  sheet4Title.value = '12-Month Revenue Forecast';
  sheet4Title.font = { bold: true, size: 14 };
  sheet4Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet4Title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  sheet4.getCell('A3').value = 'Annual Revenue:';
  sheet4.getCell('A3').font = { bold: true };
  sheet4.getCell('B3').value = formatCurrency(forecast.annualRevenue);

  sheet4.getCell('A4').value = 'Annual Surplus:';
  sheet4.getCell('A4').font = { bold: true };
  sheet4.getCell('B4').value = formatCurrency(forecast.annualSurplus);

  sheet4.getCell('A5').value = 'Break-Even Month:';
  sheet4.getCell('A5').font = { bold: true };
  sheet4.getCell('B5').value = forecast.breakEvenMonthIndex ? `Month ${forecast.breakEvenMonthIndex}` : 'Not reached';

  const sheet4Header = sheet4.getRow(7);
  sheet4Header.values = ['Month', 'Revenue', 'Total Costs', 'Surplus'];
  sheet4Header.font = { bold: true };
  sheet4Header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' }
  };

  forecast.months.forEach((month, index) => {
    const rowNum = 8 + index;
    const row = sheet4.getRow(rowNum);
    row.values = [
      month.label,
      formatCurrency(month.revenue),
      formatCurrency(month.totalCosts),
      formatCurrency(month.surplus),
    ];

    if (month.surplus < 0) {
      row.getCell(4).font = { color: { argb: 'FFDC2626' } };
    } else {
      row.getCell(4).font = { color: { argb: 'FF16A34A' } };
    }

    if (forecast.breakEvenMonthIndex === month.monthIndex) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCFCE7' }
      };
    }
  });

  const totalRow = sheet4.getRow(20);
  totalRow.values = ['TOTAL', formatCurrency(forecast.annualRevenue), formatCurrency(forecast.months.reduce((sum, m) => sum + m.totalCosts, 0)), formatCurrency(forecast.annualSurplus)];
  totalRow.font = { bold: true };

  const sheet5 = workbook.addWorksheet('Insights');

  sheet5.columns = [
    { width: 12 },
    { width: 15 },
    { width: 35 },
    { width: 50 },
    { width: 50 },
  ];

  sheet5.mergeCells('A1:E1');
  const sheet5Title = sheet5.getCell('A1');
  sheet5Title.value = 'Key Insights & Recommendations';
  sheet5Title.font = { bold: true, size: 14 };
  sheet5Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet5Title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  const sheet5Header = sheet5.getRow(3);
  sheet5Header.values = ['Severity', 'Category', 'Title', 'Message', 'Suggestion'];
  sheet5Header.font = { bold: true };
  sheet5Header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  sortedInsights.forEach((insight, index) => {
    const rowNum = 4 + index;
    const row = sheet5.getRow(rowNum);
    row.values = [
      insight.severity.toUpperCase(),
      insight.category,
      insight.title,
      insight.message,
      insight.suggestion || '',
    ];

    row.alignment = { wrapText: true, vertical: 'top' };

    const severityColor = insight.severity === 'critical' ? 'FFDC2626' :
                         insight.severity === 'warning' ? 'FFEAB308' : 'FF3B82F6';
    row.getCell(1).font = { bold: true, color: { argb: severityColor } };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_Report.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
