import { HoursVisualizationData } from '../hoursVisualization/types';
import { buildPrintReadyHTML } from './printHtmlBuilder';
import { svgToPngDataUrl } from './chartToImage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BusinessPlanExportOptions {
  planHtml: string;
  businessName: string;
  hoursData?: HoursVisualizationData;
  hasServiceShifts?: boolean;
}

async function convertSvgElementsToPng(container: HTMLElement): Promise<void> {
  const svgElements = container.querySelectorAll('svg');

  for (const svg of Array.from(svgElements)) {
    try {
      const svgString = new XMLSerializer().serializeToString(svg);
      const pngDataUrl = await svgToPngDataUrl(svgString, 1.0);

      const img = document.createElement('img');
      img.src = pngDataUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';

      svg.parentNode?.replaceChild(img, svg);
    } catch (error) {
      console.error('Failed to convert SVG to PNG:', error);
    }
  }
}

export async function exportBusinessPlanPDF(options: BusinessPlanExportOptions): Promise<void> {
  const { planHtml, businessName, hoursData, hasServiceShifts = false } = options;

  const chartMode = hasServiceShifts ? 'detailed' : 'simple';

  const printHtml = await buildPrintReadyHTML(
    planHtml,
    businessName,
    hoursData,
    {
      includePageBreaks: true,
      includeTOC: true,
      chartMode,
    }
  );

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = printHtml;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '0';
  tempDiv.style.top = '0';
  tempDiv.style.width = '794px';
  tempDiv.style.background = 'white';
  tempDiv.style.padding = '40px';
  tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  tempDiv.style.lineHeight = '1.6';
  tempDiv.style.color = '#1e293b';
  tempDiv.style.opacity = '0';
  tempDiv.style.pointerEvents = 'none';
  tempDiv.style.zIndex = '-9999';
  tempDiv.style.visibility = 'hidden';

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.appendChild(tempDiv);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const sections = tempDiv.querySelectorAll('section, .toc-page, .cover-page');

    if (sections.length === 0) {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position + 10, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }
    } else {
      let firstPage = true;

      for (const section of Array.from(sections)) {
        if (!firstPage) {
          pdf.addPage();
        }
        firstPage = false;

        const canvas = await html2canvas(section as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight <= pdfHeight - 20) {
          pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
        } else {
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
          heightLeft -= pdfHeight - 20;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 10, position + 10, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 20;
          }
        }
      }
    }

    pdf.save(`${businessName.replace(/[^a-z0-9]/gi, '_')}_Business_Plan.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    document.body.style.overflow = originalOverflow;
    document.body.removeChild(tempDiv);
  }
}

export async function exportBusinessPlanWord(options: BusinessPlanExportOptions): Promise<void> {
  const { planHtml, businessName, hoursData, hasServiceShifts = false } = options;

  const chartMode = hasServiceShifts ? 'detailed' : 'simple';

  const printHtml = await buildPrintReadyHTML(
    planHtml,
    businessName,
    hoursData,
    {
      includePageBreaks: true,
      includeTOC: true,
      chartMode,
    }
  );

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = printHtml;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '0';
  tempDiv.style.top = '0';
  tempDiv.style.opacity = '0';
  tempDiv.style.pointerEvents = 'none';
  tempDiv.style.zIndex = '-9999';
  tempDiv.style.visibility = 'hidden';

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.appendChild(tempDiv);

  try {
    await convertSvgElementsToPng(tempDiv);

    const fullHtml = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${businessName} - Business Plan</title>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    h1 { font-size: 20pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; page-break-after: avoid; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 10pt; margin-bottom: 6pt; page-break-after: avoid; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; table-layout: fixed; line-height: 1.2; }
    th, td { border: 1px solid #000; padding: 2pt 6pt; word-wrap: break-word; }
    th { background-color: #f0f0f0; font-weight: bold; padding: 3pt 6pt; }
    p { margin-bottom: 8pt; }
    section { page-break-before: always; }
    .toc-page { page-break-after: always; }
    .hours-section-wrapper { page-break-inside: avoid; }
    img { max-width: 5.5in !important; width: 5.5in !important; height: auto !important; display: block; margin: 8pt 0; }
  </style>
</head>
<body>
  ${tempDiv.innerHTML}
</body>
</html>
  `.trim();

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Business_Plan.doc`;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.style.overflow = originalOverflow;
    document.body.removeChild(tempDiv);
  }
}
