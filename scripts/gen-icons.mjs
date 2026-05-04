// Generate the Applify brand-mark icons (16/48/128) from an inline SVG into
// public/icons/. Run via `node scripts/gen-icons.mjs`. The mark is a conic-gradient
// disc with a dark inner core and a soft top-left highlight — the same visual the
// React prototype renders for its `Brand` component.

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// SVG renders the conic-gradient via 12 angular sectors. SVG has no native
// `conic-gradient`, so we approximate with a series of <path> wedges blending
// between the same color stops as the prototype.
const STOPS = [
  { a:   0, c: '#ff8a3d' },
  { a:  60, c: '#ff4a8d' },
  { a: 130, c: '#a460ff' },
  { a: 210, c: '#5b8bff' },
  { a: 280, c: '#3dd6c2' },
  { a: 340, c: '#ffc24a' },
  { a: 360, c: '#ff8a3d' },
];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const hex = (h) => h.match(/\w\w/g).map((s) => parseInt(s, 16));
const colorAt = (deg) => {
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (deg >= STOPS[i].a && deg <= STOPS[i + 1].a) {
      const t = (deg - STOPS[i].a) / (STOPS[i + 1].a - STOPS[i].a);
      const lo = hex(STOPS[i].c), hi = hex(STOPS[i + 1].c);
      return `rgb(${lerp(lo[0], hi[0], t)},${lerp(lo[1], hi[1], t)},${lerp(lo[2], hi[2], t)})`;
    }
  }
  return STOPS[0].c;
};

function buildSvg(size) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.46;
  const inner = size * 0.18;
  const N = 180; // 2° wedges — smooth enough at every scale
  const wedges = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * 360 - 90;
    const a1 = ((i + 1) / N) * 360 - 90 + 0.4; // slight overlap to hide seams
    const rad0 = (a0 * Math.PI) / 180;
    const rad1 = (a1 * Math.PI) / 180;
    const x0 = (cx + r * Math.cos(rad0)).toFixed(3);
    const y0 = (cy + r * Math.sin(rad0)).toFixed(3);
    const x1 = (cx + r * Math.cos(rad1)).toFixed(3);
    const y1 = (cy + r * Math.sin(rad1)).toFixed(3);
    const fill = colorAt((i / N) * 360);
    wedges.push(
      `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${fill}"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="rim" cx="${(cx - r * 0.4).toFixed(2)}" cy="${(cy - r * 0.4).toFixed(2)}" r="${r}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="white" stop-opacity="0.5"/>
        <stop offset="0.4" stop-color="white" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${wedges.join('')}
    <circle cx="${cx}" cy="${cy}" r="${inner}" fill="#0c0c10"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rim)"/>
  </svg>`;
}

for (const size of [16, 48, 128]) {
  const svg = buildSvg(size);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const path = resolve(outDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
