import { HoursVisualizationData } from '../hoursVisualization/types';
import { generateHoursChartSvg } from './hoursChartSvgRenderer';

export interface ChartImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export async function renderChartToDataURL(
  data: HoursVisualizationData,
  mode: 'simple' | 'detailed'
): Promise<string> {
  const svgString = generateHoursChartSvg(data, mode, '12h');
  const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64Svg}`;
}

export function renderChartToSvgString(
  data: HoursVisualizationData,
  mode: 'simple' | 'detailed'
): string {
  return generateHoursChartSvg(data, mode, '12h');
}

export async function renderChartToBlob(
  data: HoursVisualizationData,
  mode: 'simple' | 'detailed'
): Promise<Blob> {
  const svgString = generateHoursChartSvg(data, mode, '12h');
  return new Blob([svgString], { type: 'image/svg+xml' });
}

export async function svgToPngDataUrl(svgString: string, scale: number = 1.0): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    const viewBox = svgElement.getAttribute('viewBox');
    let width = parseFloat(svgElement.getAttribute('width') || '800');
    let height = parseFloat(svgElement.getAttribute('height') || '600');

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      width = vbWidth || width;
      height = vbHeight || height;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      try {
        const pngDataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(pngDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
}
