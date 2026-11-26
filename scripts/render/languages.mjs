// Languages I write: one stacked bar plus a two-column legend.
import { FONT_SANS } from '../lib/theme.mjs';
import { esc, svgDoc } from '../lib/svg.mjs';
import { colorFor } from '../lib/languages.mjs';

const W = 500;
const H = 320;
const BAR_Y = 72;
const BAR_H = 14;
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function renderLanguages(rows, { updated }, t) {
  // A 2px gap after each segment shows the track, so neighbouring blues stay apart.
  const GAP = 2;
  let x = 0;
  const segments = rows.map((r, i) => {
    const w = (r.pct / 100) * W;
    const drawn = i < rows.length - 1 ? Math.max(w - GAP, 0.5) : w;
    const seg = `<rect class="seg" style="animation-delay:${i * 70}ms" x="${Math.round(x * 100) / 100}" y="${BAR_Y}" width="${Math.round(drawn * 100) / 100}" height="${BAR_H}" fill="${colorFor(r.name, t.name)}"/>`;
    x += w;
    return seg;
  });
  const legend = rows.map((r, i) => {
    const colX = i < 4 ? 0 : 264;
    const y = 124 + (i % 4) * 36;
    return `<g class="item" style="animation-delay:${300 + i * 60}ms">`
      + `<circle cx="${colX + 6}" cy="${y - 5}" r="6" fill="${colorFor(r.name, t.name)}"/>`
      + `<text x="${colX + 20}" y="${y}" font-size="15" fill="${t.ink}">${esc(r.name)}</text>`
      + `<text x="${colX + 232}" y="${y}" text-anchor="end" font-size="15" fill="${t.slate}">${r.pct.toFixed(1)}%</text>`
      + '</g>';
  });
  const [year, month] = updated.split('-').map(Number);
  const body = `<defs><clipPath id="barClip"><rect x="0" y="${BAR_Y}" width="${W}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath></defs>
<text x="0" y="24" font-size="18" font-weight="600" fill="${t.ink}">Languages I write</text>
<text x="0" y="46" font-size="13" fill="${t.faint}">Share of lines I added in my commits, last 12 months</text>
${rows.length
    ? `<rect x="0" y="${BAR_Y}" width="${W}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${t.rule}"/><g clip-path="url(#barClip)">${segments.join('')}</g>\n${legend.join('\n')}`
    : `<text x="0" y="124" font-size="15" fill="${t.slate}">No language data yet</text>`}
<text x="0" y="${H - 10}" font-size="13" fill="${t.faint}">Updated ${FULL_MONTHS[month - 1]} ${year}</text>`;
  const css = `
text { font-family: ${FONT_SANS}; font-variant-numeric: tabular-nums; }
.seg { transform-box: fill-box; transform-origin: 0 50%; animation: grow .7s cubic-bezier(.2, .7, .2, 1) backwards; }
.item { animation: fade .4s ease-out backwards; }
@keyframes grow { from { transform: scaleX(0); } }
@keyframes fade { from { opacity: 0; } }`;
  const title = rows.length ? `Languages I write: ${rows.map((r) => `${r.name} ${r.pct.toFixed(1)}%`).join(', ')}` : 'Languages I write: no data yet';
  return svgDoc({ width: W, height: H, title, css, body });
}
