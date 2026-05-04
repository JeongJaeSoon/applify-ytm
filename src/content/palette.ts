// Canvas-based dominant-color extraction.
// Loads the artwork via crossOrigin='anonymous' (googleusercontent serves CORS-friendly headers
// for `=...rj` thumbnails). Bins pixels into a small HSL grid, picks the most-saturated dominant.

import type { Palette, RGB } from '../lib/types';
import { NEUTRAL_PALETTE } from '../lib/types';

const CANVAS_SIZE = 50;

export async function extractPalette(url: string): Promise<Palette> {
  const img = await loadImage(url);
  if (!img) return NEUTRAL_PALETTE;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return NEUTRAL_PALETTE;

  try {
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    return quantize(data);
  } catch {
    // Cross-origin tainted canvas — return neutral
    return NEUTRAL_PALETTE;
  }
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

interface Bin {
  sumR: number;
  sumG: number;
  sumB: number;
  count: number;
  sat: number;
  lum: number;
}

function quantize(data: Uint8ClampedArray): Palette {
  const bins = new Map<string, Bin>();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.08 || l > 0.94) continue; // skip near-black/near-white
    if (s < 0.08) continue;              // skip grayscale

    const key = `${Math.round(h * 12)},${Math.round(l * 4)}`;
    let bin = bins.get(key);
    if (!bin) {
      bin = { sumR: 0, sumG: 0, sumB: 0, count: 0, sat: 0, lum: 0 };
      bins.set(key, bin);
    }
    bin.sumR += r;
    bin.sumG += g;
    bin.sumB += b;
    bin.count++;
    bin.sat = Math.max(bin.sat, s);
    bin.lum = l;
  }

  const ranked = [...bins.values()]
    .map((b) => ({
      rgb: [b.sumR / b.count, b.sumG / b.count, b.sumB / b.count] as [number, number, number],
      score: b.count * (b.sat + 0.2),
      lum: b.lum,
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return NEUTRAL_PALETTE;

  const dom = ranked[0].rgb;
  const second = ranked[1]?.rgb ?? dom;

  return {
    bg: scale(dom, 0.55),
    bg2: scale(second, 0.85),
    accent: lighten(dom, 1.45),
  };
}

function scale(rgb: [number, number, number], k: number): RGB {
  return [
    Math.round(Math.max(0, Math.min(255, rgb[0] * k))),
    Math.round(Math.max(0, Math.min(255, rgb[1] * k))),
    Math.round(Math.max(0, Math.min(255, rgb[2] * k))),
  ];
}

function lighten(rgb: [number, number, number], k: number): RGB {
  const r = rgb[0] * k;
  const g = rgb[1] * k;
  const b = rgb[2] * k;
  return [
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b))),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = ((b - r) / d + 2);
  else h = ((r - g) / d + 4);
  h /= 6;
  return [h, s, l];
}
