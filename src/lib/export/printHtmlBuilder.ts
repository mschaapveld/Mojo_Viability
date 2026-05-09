import { HoursVisualizationData } from '../hoursVisualization/types';
import { renderChartToSvgString } from './chartToImage';

export interface PrintHtmlOptions {
  includePageBreaks?: boolean;
  includeTOC?: boolean;
  chartMode?: 'simple' | 'detailed';
}

interface SectionInfo {
  number: string;
  title: string;
  anchor: string;
}

export async function buildPrintReadyHTML(
  planHtml: string,
  businessName: string,
  hoursData?: HoursVisualizationData,
  options: PrintHtmlOptions = {}
): Promise<string> {
  const {
    includePageBreaks = true,
    includeTOC = true,
    chartMode = 'detailed',
  } = options;

  let processedHtml = planHtml;

  const hasPlaceholder = planHtml.includes('hours-visualization-placeholder');
  console.log('[Export] Hours placeholder found:', hasPlaceholder);
  console.log('[Export] Hours data provided:', !!hoursData);
  console.log('[Export] Chart mode:', chartMode);

  if (hasPlaceholder) {
    const placeholderIndex = planHtml.indexOf('hours-visualization-placeholder');
    const contextStart = Math.max(0, placeholderIndex - 100);
    const contextEnd = Math.min(planHtml.length, placeholderIndex + 200);
    const context = planHtml.substring(contextStart, contextEnd);
    console.log('[Export] Placeholder context:', context);
  }

  if (hasPlaceholder && hoursData) {
    try {
      console.log('[Export] Rendering Hours of Operation chart as inline SVG...');
      const svgString = renderChartToSvgString(hoursData, chartMode);
      console.log('[Export] SVG chart rendered successfully, length:', svgString.length);

      const svgContainer = `<div id="hours-visualization-img" style="max-width: 85%; width: 85%; margin: 12px 0; display: block; page-break-inside: avoid; break-inside: avoid;">${svgString}</div>`;

      const beforeReplace = processedHtml;
      processedHtml = processedHtml.replace(
        /<div[^>]*id=["']hours-visualization-placeholder["'][^>]*>.*?<\/div>/gs,
        svgContainer
      );

      processedHtml = processedHtml.replace(
        /(<h3[^>]*>[^<]*Hours of Operation[^<]*<\/h3>)/gi,
        '<div class="hours-section-wrapper" style="page-break-inside: avoid; break-inside: avoid;">$1'
      );

      const closingDivIndex = processedHtml.indexOf('</div>', processedHtml.indexOf('hours-visualization-img'));
      if (closingDivIndex !== -1) {
        processedHtml = processedHtml.slice(0, closingDivIndex + 6) + '</div>' + processedHtml.slice(closingDivIndex + 6);
      }

      const replacementMade = beforeReplace !== processedHtml;
      console.log('[Export] Placeholder replaced:', replacementMade);

      if (!replacementMade) {
        console.error('[Export] WARNING: Placeholder found but replacement failed!');
        console.error('[Export] Trying alternative replacement pattern...');
        processedHtml = beforeReplace.replace(
          /hours-visualization-placeholder/g,
          'hours-visualization-placeholder-REPLACED'
        );
        const testReplacement = beforeReplace !== processedHtml;
        console.error('[Export] Test replacement worked:', testReplacement);

        const errorBox = `<div style="border: 2px solid #dc2626; background-color: #fef2f2; padding: 16px; margin: 12px 0; border-radius: 4px; color: #991b1b;">
          <strong>Hours of Operation chart could not be embedded.</strong><br/>
          The placeholder was found but image replacement failed. Please try exporting again.
        </div>`;
        processedHtml = beforeReplace.replace(
          /<div[^>]*id=["']hours-visualization-placeholder["'][^>]*>.*?<\/div>/gs,
          errorBox
        );
      }
    } catch (error) {
      console.error('[Export] Failed to render Hours chart:', error);
      const errorBox = `<div style="border: 2px solid #dc2626; background-color: #fef2f2; padding: 16px; margin: 12px 0; border-radius: 4px; color: #991b1b;">
        <strong>Hours of Operation chart could not be rendered for export.</strong><br/>
        Error: ${error instanceof Error ? error.message : String(error)}<br/>
        Please try again.
      </div>`;
      processedHtml = processedHtml.replace(
        /<div[^>]*id=["']hours-visualization-placeholder["'][^>]*>.*?<\/div>/gs,
        errorBox
      );
    }
  } else if (hasPlaceholder && !hoursData) {
    console.warn('[Export] Placeholder found but no hours data provided');
    const warningBox = `<div style="border: 2px solid #f59e0b; background-color: #fffbeb; padding: 16px; margin: 12px 0; border-radius: 4px; color: #92400e;">
      <strong>Hours of Operation data not available.</strong><br/>
      Please ensure Hours of Operation is configured in Step 4 before exporting.
    </div>`;
    processedHtml = processedHtml.replace(
      /<div[^>]*id=["']hours-visualization-placeholder["'][^>]*>.*?<\/div>/gs,
      warningBox
    );
  }

  const stillHasPlaceholder = processedHtml.includes('hours-visualization-placeholder');
  if (stillHasPlaceholder) {
    console.error('[Export] ERROR: Placeholder still exists in final HTML!');
  } else {
    console.log('[Export] Placeholder successfully removed from HTML');
  }

  const sections = extractSections(processedHtml);

  if (includePageBreaks) {
    processedHtml = addPageBreaks(processedHtml, sections);
  }

  const tocHtml = includeTOC ? generateTableOfContents(sections, businessName) : '';

  const printStyles = generatePrintStyles(includePageBreaks);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${businessName} - Business Plan</title>
    ${printStyles}
  </head>
  <body>
    ${tocHtml}
    ${processedHtml}
  </body>
</html>
  `.trim();
}

function extractSections(html: string): SectionInfo[] {
  const sections: SectionInfo[] = [];

  const sectionRegex = /<h2[^>]*class="[^"]*text-xl[^"]*font-bold[^"]*"[^>]*>(\d+)\.\s*([^<]+)<\/h2>/g;

  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const number = match[1];
    const title = match[2].trim();
    const anchor = `section-${number}`;
    sections.push({ number, title, anchor });
  }

  if (html.includes('Disclaimer')) {
    sections.push({ number: '', title: 'Disclaimer', anchor: 'disclaimer' });
  }

  return sections;
}

function generateTableOfContents(sections: SectionInfo[], businessName: string): string {
  return `
<div class="toc-page" style="page-break-after: always;">
  <div style="text-align: center; margin-top: 100px; margin-bottom: 60px;">
    <h1 style="font-size: 32px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">
      ${businessName}
    </h1>
    <p style="font-size: 20px; color: #64748b; margin-bottom: 40px;">
      Business Plan
    </p>
    <p style="font-size: 14px; color: #94a3b8;">
      Generated: ${new Date().toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}
    </p>
  </div>

  <div style="margin-top: 80px;">
    <h2 style="font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">
      Contents
    </h2>
    <div style="font-size: 14px; line-height: 2.2;">
      ${sections.map(section => {
        const displayNumber = section.number ? `${section.number}.` : '';
        return `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #cbd5e1;">
          <span style="font-weight: 500; color: #334155;">
            ${displayNumber} ${section.title}
          </span>
        </div>
        `;
      }).join('')}
    </div>
  </div>
</div>
  `.trim();
}

function addPageBreaks(html: string, sections: SectionInfo[]): string {
  let processedHtml = html;

  sections.forEach((section, index) => {
    if (index === 0) return;

    const sectionPattern = new RegExp(
      `(<section[^>]*>\\s*<h2[^>]*class="[^"]*text-xl[^"]*font-bold[^"]*"[^>]*>${section.number}\\.\\s*${escapeRegex(section.title)}<\\/h2>)`,
      'g'
    );

    processedHtml = processedHtml.replace(
      sectionPattern,
      `<section id="${section.anchor}" style="page-break-before: always;" class="mb-10">
        <h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-blue-500">${section.number}. ${section.title}</h2>`
    );
  });

  if (html.includes('Disclaimer')) {
    processedHtml = processedHtml.replace(
      /(<h2[^>]*>Disclaimer<\/h2>)/,
      '<div id="disclaimer" style="page-break-before: always;">$1'
    );
    processedHtml = processedHtml.replace(
      /(<\/body>)/,
      '</div>$1'
    );
  }

  return processedHtml;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generatePrintStyles(includePageBreaks: boolean): string {
  return `
<style>
  @media print {
    @page {
      size: A4;
      margin: 2cm;
    }

    ${includePageBreaks ? `
    .page-break {
      page-break-before: always;
    }

    h2.text-xl {
      page-break-after: avoid;
    }

    section {
      page-break-inside: avoid;
    }
    ` : ''}
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    padding: 40px;
    max-width: 21cm;
    margin: 0 auto;
    background: white;
  }

  h1 {
    font-size: 28px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 22px;
    font-weight: bold;
    color: #1e293b;
    margin-top: 32px;
    margin-bottom: 16px;
  }

  h2.text-xl {
    font-size: 24px;
    padding-bottom: 8px;
    border-bottom: 3px solid #3b82f6;
    margin-bottom: 20px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #334155;
    margin-top: 24px;
    margin-bottom: 12px;
  }

  p {
    margin-bottom: 12px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 14px;
    table-layout: fixed;
    line-height: 1.2;
  }

  th, td {
    padding: 3px 8px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #475569;
    padding: 4px 8px;
  }

  tr:hover {
    background-color: #f8fafc;
  }

  .bg-slate-50 { background-color: #f8fafc; }
  .bg-slate-100 { background-color: #f1f5f9; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-blue-100 { background-color: #dbeafe; }
  .bg-green-50 { background-color: #f0fdf4; }
  .bg-amber-50 { background-color: #fffbeb; }
  .bg-red-50 { background-color: #fef2f2; }

  .text-slate-600 { color: #475569; }
  .text-slate-700 { color: #334155; }
  .text-slate-800 { color: #1e293b; }
  .text-blue-600 { color: #2563eb; }
  .text-blue-700 { color: #1d4ed8; }
  .text-green-600 { color: #16a34a; }
  .text-green-700 { color: #15803d; }
  .text-amber-700 { color: #b45309; }
  .text-red-600 { color: #dc2626; }
  .text-red-700 { color: #b91c1c; }

  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }

  .text-xs { font-size: 12px; }
  .text-sm { font-size: 14px; }
  .text-lg { font-size: 18px; }
  .text-xl { font-size: 20px; }
  .text-2xl { font-size: 24px; }

  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mb-8 { margin-bottom: 32px; }
  .mb-10 { margin-bottom: 40px; }

  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mt-8 { margin-top: 32px; }
  .mt-10 { margin-top: 40px; }

  .p-3 { padding: 12px; }
  .p-4 { padding: 16px; }
  .px-2 { padding-left: 8px; padding-right: 8px; }
  .px-3 { padding-left: 12px; padding-right: 12px; }
  .py-2 { padding-top: 8px; padding-bottom: 8px; }

  .border { border: 1px solid #e2e8f0; }
  .border-b { border-bottom: 1px solid #e2e8f0; }
  .border-b-2 { border-bottom: 2px solid; }
  .border-blue-200 { border-color: #bfdbfe; }
  .border-green-200 { border-color: #bbf7d0; }
  .border-amber-200 { border-color: #fde68a; }
  .border-red-200 { border-color: #fecaca; }
  .border-blue-500 { border-color: #3b82f6; }

  .rounded { border-radius: 4px; }
  .rounded-lg { border-radius: 8px; }

  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .italic { font-style: italic; }

  section {
    margin-bottom: 40px;
  }

  .leading-relaxed {
    line-height: 1.75;
  }

  .grid {
    display: grid;
    gap: 16px;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .gap-6 { gap: 24px; }

  ul, ol {
    margin-left: 24px;
    margin-bottom: 16px;
  }

  li {
    margin-bottom: 8px;
  }

  img {
    max-width: 85% !important;
    width: 85% !important;
    height: auto !important;
    display: block;
    margin: 12px 0;
  }
</style>
  `.trim();
}
