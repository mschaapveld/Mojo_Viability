import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { formatCurrency, formatPercentage, calculateRequiredSales, calculateFixedCosts, PERIOD_OUTPUT_FACTORS } from './calculations';

export const exportSimpleBreakEvenToExcel = async (scenarioName: string, scenarioData: any) => {
  const simpleData = scenarioData.simpleBreakEven;
  const period = scenarioData.period || 'Monthly';
  const simpleTotalVariable = simpleData.variableCogs + simpleData.variableLabour + simpleData.variableOther;
  const simpleBreakEven = calculateRequiredSales(simpleData.rent, 0, simpleTotalVariable);
  const simpleRequiredSales = calculateRequiredSales(simpleData.rent, simpleData.ownersReturn, simpleTotalVariable);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Simple Break-Even');

  worksheet.columns = [
    { width: 40 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];

  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'MojoBusiness.ai';
  titleCell.font = { bold: true, size: 18 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:D2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = 'Simple Break-Even Analysis';
  subtitleCell.font = { bold: true, size: 16 };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const scenarioCell = worksheet.getCell('A4');
  scenarioCell.value = scenarioName;
  scenarioCell.font = { bold: true, size: 14 };

  const addressLine = scenarioData.location?.address || scenarioData.storeTown || '';
  if (addressLine) {
    const addressCell = worksheet.getCell('A5');
    addressCell.value = addressLine;
    addressCell.font = { size: 10 };
  }

  const dateCell = worksheet.getCell('A6');
  dateCell.value = `Generated: ${new Date().toLocaleDateString()}`;
  dateCell.font = { size: 9, italic: true };

  const headerRow = worksheet.getRow(8);
  headerRow.values = ['Item', 'Weekly', 'Monthly', 'Yearly'];
  headerRow.font = { bold: true };
  headerRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  headerRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  headerRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  headerRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

  ['A8', 'B8', 'C8', 'D8'].forEach(cellAddress => {
    worksheet.getCell(cellAddress).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
  });

  const scaleValue = (value: number, isPercent: boolean, fromPeriod: string, toPeriod: string) => {
    if (isPercent) return value;
    if (fromPeriod === toPeriod) return value;

    const periodFactors: Record<string, number> = {
      'Weekly': 1,
      'Monthly': PERIOD_OUTPUT_FACTORS.Monthly,
      'Yearly': PERIOD_OUTPUT_FACTORS.Yearly,
    };

    return (value / periodFactors[fromPeriod]) * periodFactors[toPeriod];
  };

  const dataRows = [
    { label: 'Expected Sales', value: simpleData.enteredSales, isPercent: false },
    { label: 'Owner\'s Return', value: simpleData.ownersReturn, isPercent: false },
    { label: 'Fixed Costs (Rent)', value: simpleData.rent, isPercent: false },
    { label: 'Variable COGS', value: simpleData.variableCogs / 100, isPercent: true },
    { label: 'Variable Labour', value: simpleData.variableLabour / 100, isPercent: true },
    { label: 'Variable Other', value: simpleData.variableOther / 100, isPercent: true },
    { label: 'Total Variable %', value: simpleTotalVariable / 100, isPercent: true },
    { label: 'Required Sales to Break-Even', value: simpleBreakEven, isPercent: false },
    { label: 'Required Sales to Pay Owner', value: simpleRequiredSales, isPercent: false },
    { label: 'Surplus/Shortfall (Not Profit)', value: simpleData.enteredSales - simpleRequiredSales, isPercent: false },
  ];

  dataRows.forEach((rowData, index) => {
    const row = worksheet.getRow(9 + index);
    const weeklyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Weekly');
    const monthlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Monthly');
    const yearlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Yearly');

    row.values = [rowData.label, weeklyVal, monthlyVal, yearlyVal];
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    const format = rowData.isPercent ? '0.00%' : '$#,##0.00';
    [2, 3, 4].forEach(col => {
      row.getCell(col).numFmt = format;
      row.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
    });
  });

  const disclaimerCell = worksheet.getCell('A20');
  disclaimerCell.value = 'Disclaimer: This tool provides indicative results only and should not be relied upon as financial advice.';
  disclaimerCell.font = { size: 8, italic: true };
  disclaimerCell.alignment = { wrapText: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenarioName.replace(/\s+/g, '_')}_Simple.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = (scenarioName: string, scenarioData: any, _user: any) => {
  console.log('Export to Excel:', scenarioName, scenarioData);
};

export const exportSimpleBreakEvenToPDF = (scenarioName: string, scenarioData: any) => {
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MojoBusiness.ai', 105, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(14);
  doc.text('Simple Break-Even Analysis', 105, yPos, { align: 'center' });

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(scenarioName, 105, yPos, { align: 'center' });

  yPos += 5;
  const addressLine = scenarioData.location?.address || scenarioData.storeTown || '';
  if (addressLine) {
    doc.setFontSize(9);
    doc.text(addressLine, 105, yPos, { align: 'center' });
    yPos += 5;
  }

  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });

  yPos += 10;

  const simpleData = scenarioData.simpleBreakEven;
  const period = scenarioData.period || 'Monthly';
  const simpleTotalVariable = simpleData.variableCogs + simpleData.variableLabour + simpleData.variableOther;
  const simpleBreakEven = calculateRequiredSales(simpleData.rent, 0, simpleTotalVariable);
  const simpleRequiredSales = calculateRequiredSales(simpleData.rent, simpleData.ownersReturn, simpleTotalVariable);

  const scaleValue = (value: number, isPercent: boolean, fromPeriod: string, toPeriod: string) => {
    if (isPercent) return value;
    if (fromPeriod === toPeriod) return value;

    const periodFactors: Record<string, number> = {
      'Weekly': 1,
      'Monthly': PERIOD_OUTPUT_FACTORS.Monthly,
      'Yearly': PERIOD_OUTPUT_FACTORS.Yearly,
    };

    return (value / periodFactors[fromPeriod]) * periodFactors[toPeriod];
  };

  const dataRows = [
    { label: 'Expected Sales', value: simpleData.enteredSales, isPercent: false },
    { label: 'Owner\'s Return', value: simpleData.ownersReturn, isPercent: false },
    { label: 'Fixed Costs (Rent)', value: simpleData.rent, isPercent: false },
    { label: 'Variable COGS', value: simpleData.variableCogs, isPercent: true },
    { label: 'Variable Labour', value: simpleData.variableLabour, isPercent: true },
    { label: 'Variable Other', value: simpleData.variableOther, isPercent: true },
    { label: 'Total Variable %', value: simpleTotalVariable, isPercent: true },
    { label: 'Required Sales to Break-Even', value: simpleBreakEven, isPercent: false },
    { label: 'Required Sales to Pay Owner', value: simpleRequiredSales, isPercent: false },
    { label: 'Surplus/Shortfall (Not Profit)', value: simpleData.enteredSales - simpleRequiredSales, isPercent: false },
  ];

  const bodyData = dataRows.map(rowData => {
    const weeklyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Weekly');
    const monthlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Monthly');
    const yearlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Yearly');

    return [
      rowData.label,
      rowData.isPercent ? formatPercentage(weeklyVal) : formatCurrency(weeklyVal),
      rowData.isPercent ? formatPercentage(monthlyVal) : formatCurrency(monthlyVal),
      rowData.isPercent ? formatPercentage(yearlyVal) : formatCurrency(yearlyVal)
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Weekly', 'Monthly', 'Yearly']],
    body: bodyData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Disclaimer: This tool provides indicative results only and should not be relied upon as financial advice.', 105, 280, { align: 'center' });
  doc.text('© 2025 MojoBusiness.ai. All rights reserved.', 105, 285, { align: 'center' });

  doc.save(`${scenarioName.replace(/\s+/g, '_')}_Simple.pdf`);
};

export const exportToPDF = (scenarioName: string, scenarioData: any, user: any) => {
  const doc = new jsPDF();

  if (!user) {
    let yPos = 100;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MojoBusiness.ai', 105, yPos, { align: 'center' });

    yPos += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Login or Create an account', 105, yPos, { align: 'center' });

    yPos += 10;
    doc.text('to access these features', 105, yPos, { align: 'center' });

    doc.save('MojoBusiness_Export.pdf');
    return;
  }

  const { period } = scenarioData;
  let yPos = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MojoBusiness.ai Financial Report', 105, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(14);
  doc.text(scenarioName, 105, yPos, { align: 'center' });

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${period}`, 105, yPos, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos + 5, { align: 'center' });

  yPos += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Simple Break-Even Analysis', 14, yPos);
  yPos += 5;

  const simpleData = scenarioData.simpleBreakEven;
  const simpleTotalVariable = simpleData.variableCogs + simpleData.variableLabour + simpleData.variableOther;
  const simpleBreakEven = calculateRequiredSales(simpleData.rent, 0, simpleTotalVariable);
  const simpleRequiredSales = calculateRequiredSales(simpleData.rent, simpleData.ownersReturn, simpleTotalVariable);

  const scaleValue = (value: number, isPercent: boolean, fromPeriod: string, toPeriod: string) => {
    if (isPercent) return value;
    if (fromPeriod === toPeriod) return value;

    const periodFactors: Record<string, number> = {
      'Weekly': 1,
      'Monthly': PERIOD_OUTPUT_FACTORS.Monthly,
      'Yearly': PERIOD_OUTPUT_FACTORS.Yearly,
    };

    return (value / periodFactors[fromPeriod]) * periodFactors[toPeriod];
  };

  const simpleDataRows = [
    { label: 'Expected Sales', value: simpleData.enteredSales, isPercent: false },
    { label: 'Owner\'s Return', value: simpleData.ownersReturn, isPercent: false },
    { label: 'Fixed Costs (Rent)', value: simpleData.rent, isPercent: false },
    { label: 'Variable COGS', value: simpleData.variableCogs, isPercent: true },
    { label: 'Variable Labour', value: simpleData.variableLabour, isPercent: true },
    { label: 'Variable Other', value: simpleData.variableOther, isPercent: true },
    { label: 'Total Variable %', value: simpleTotalVariable, isPercent: true },
    { label: 'Required Sales to Break-Even', value: simpleBreakEven, isPercent: false },
    { label: 'Required Sales to Pay Owner', value: simpleRequiredSales, isPercent: false },
    { label: 'Surplus/Shortfall (Not Profit)', value: simpleData.enteredSales - simpleRequiredSales, isPercent: false },
  ];

  const simpleBodyData = simpleDataRows.map(rowData => {
    const weeklyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Weekly');
    const monthlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Monthly');
    const yearlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Yearly');

    return [
      rowData.label,
      rowData.isPercent ? formatPercentage(weeklyVal) : formatCurrency(weeklyVal),
      rowData.isPercent ? formatPercentage(monthlyVal) : formatCurrency(monthlyVal),
      rowData.isPercent ? formatPercentage(yearlyVal) : formatCurrency(yearlyVal)
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Weekly', 'Monthly', 'Yearly']],
    body: simpleBodyData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Break-Even Analysis', 14, yPos);
  yPos += 5;

  const detailedData = scenarioData.detailedBreakEven;
  const detailedTotalVariable = detailedData.variableCogs + detailedData.variableLabour + detailedData.variableOther;
  const outputFactor = PERIOD_OUTPUT_FACTORS[period as keyof typeof PERIOD_OUTPUT_FACTORS];
  const annualFixed = detailedData.insurance + detailedData.accounting + detailedData.marketing + detailedData.utilities + detailedData.otherFixed;
  const detailedFixedCosts = calculateFixedCosts(detailedData.rent, annualFixed, outputFactor);
  const detailedBreakEven = calculateRequiredSales(detailedFixedCosts, 0, detailedTotalVariable);
  const detailedRequiredSales = calculateRequiredSales(detailedFixedCosts, detailedData.ownersReturn, detailedTotalVariable);

  const detailedDataRows = [
    { label: 'Expected Sales', value: detailedData.enteredSales, isPercent: false },
    { label: 'Owner\'s Return', value: detailedData.ownersReturn, isPercent: false },
    { label: 'Rent', value: detailedData.rent, isPercent: false },
    { label: 'Insurance (Annual)', value: detailedData.insurance / PERIOD_OUTPUT_FACTORS.Yearly, isPercent: false },
    { label: 'Accounting (Annual)', value: detailedData.accounting / PERIOD_OUTPUT_FACTORS.Yearly, isPercent: false },
    { label: 'Marketing (Annual)', value: detailedData.marketing / PERIOD_OUTPUT_FACTORS.Yearly, isPercent: false },
    { label: 'Utilities (Annual)', value: detailedData.utilities / PERIOD_OUTPUT_FACTORS.Yearly, isPercent: false },
    { label: 'Other Fixed (Annual)', value: detailedData.otherFixed / PERIOD_OUTPUT_FACTORS.Yearly, isPercent: false },
    { label: 'Total Fixed Costs', value: detailedFixedCosts, isPercent: false },
    { label: 'Variable COGS', value: detailedData.variableCogs, isPercent: true },
    { label: 'Variable Labour', value: detailedData.variableLabour, isPercent: true },
    { label: 'Variable Other', value: detailedData.variableOther, isPercent: true },
    { label: 'Total Variable %', value: detailedTotalVariable, isPercent: true },
    { label: 'Required Sales to Break-Even', value: detailedBreakEven, isPercent: false },
    { label: 'Required Sales to Pay Owner', value: detailedRequiredSales, isPercent: false },
    { label: 'Surplus/Shortfall (Not Profit)', value: detailedData.enteredSales - detailedRequiredSales, isPercent: false },
  ];

  const detailedBodyData = detailedDataRows.map(rowData => {
    const weeklyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Weekly');
    const monthlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Monthly');
    const yearlyVal = scaleValue(rowData.value, rowData.isPercent, period, 'Yearly');

    return [
      rowData.label,
      rowData.isPercent ? formatPercentage(weeklyVal) : formatCurrency(weeklyVal),
      rowData.isPercent ? formatPercentage(monthlyVal) : formatCurrency(monthlyVal),
      rowData.isPercent ? formatPercentage(yearlyVal) : formatCurrency(yearlyVal)
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Weekly', 'Monthly', 'Yearly']],
    body: detailedBodyData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fitout & Financing', 14, yPos);
  yPos += 5;

  const fitoutData = scenarioData.fitoutFinancing;
  const totalFitout = fitoutData.equipment + fitoutData.furniture + fitoutData.tech + fitoutData.stock + fitoutData.fitout + fitoutData.signage + fitoutData.legal;
  const totalRequired = totalFitout + fitoutData.operatingCapital;
  const fundingGap = totalRequired - fitoutData.startupCapital;

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Value']],
    body: [
      ['Equipment', formatCurrency(fitoutData.equipment)],
      ['Furniture & Fittings', formatCurrency(fitoutData.furniture)],
      ['Technology', formatCurrency(fitoutData.tech)],
      ['Opening Stock', formatCurrency(fitoutData.stock)],
      ['Fitout', formatCurrency(fitoutData.fitout)],
      ['Signage & Branding', formatCurrency(fitoutData.signage)],
      ['Legal & Licensing', formatCurrency(fitoutData.legal)],
      ['Total Fitout', formatCurrency(totalFitout)],
      ['Operating Capital', formatCurrency(fitoutData.operatingCapital)],
      ['Total Required', formatCurrency(totalRequired)],
      ['Startup Capital Available', formatCurrency(fitoutData.startupCapital)],
      ['Funding Gap', formatCurrency(fundingGap)],
      ['Loan Amount', formatCurrency(fitoutData.loanAmount)],
      ['Loan Interest Rate', formatPercentage(fitoutData.loanInterest)],
      ['Loan Term (months)', fitoutData.loanTerm.toString()],
      ['Balloon Payment %', formatPercentage(fitoutData.balloonPercent)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Disclaimer: This tool provides indicative results only and should not be relied upon as financial advice.', 105, 280, { align: 'center' });
  doc.text('© 2025 MojoBusiness.ai. All rights reserved.', 105, 285, { align: 'center' });

  doc.save(`${scenarioName.replace(/\s+/g, '_')}.pdf`);
};
