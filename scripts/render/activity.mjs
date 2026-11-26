// Contributions per month for the last twelve months; the busiest month in magenta.
import { FONT_SANS } from '../lib/theme.mjs';
import { esc, fmtNumber, plural, svgDoc } from '../lib/svg.mjs';

const W = 500;
const H = 320;
const BASE = 248;
const PLOT_H = 168;
const BAR_W = 24;
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function bar(x, h, color, opacity, delay) {
  const r = Math.min(5, h / 2);
  const y = BASE - h;
  const d = `M${x} ${BASE}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + BAR_W - r}Q${x + BAR_W} ${y} ${x + BAR_W} ${y + r}V${BASE}Z`;
  return `<path class="bar" style="animation-delay:${delay}ms" d="${d}" fill="${color}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}

export function renderActivity(months, t) {
  const max = Math.max(0, ...months.map((m) => m.total));
  const busiest = max > 0 ? months.reduce((best, m) => (m.total >= best.total ? m : best)) : null;
  const slot = W / months.length;
  const parts = months.map((m, i) => {
    const x = Math.round(i * slot + (slot - BAR_W) / 2);
    const cx = x + BAR_W / 2;
    const h = max > 0 && m.total > 0 ? Math.max(3, Math.round((m.total / max) * PLOT_H)) : 0;
    const color = m === busiest ? t.magenta : t.blue;
    const shape = h > 0 ? bar(x, h, color, m.current ? 0.55 : 1, i * 45) : '';
    const value = m.total > 0 ? `<text class="val" style="animation-delay:${400 + i * 45}ms" x="${cx}" y="${BASE - h - 8}" text-anchor="middle" font-size="12" fill="${t.faint}">${fmtNumber(m.total)}</text>` : '';
    const label = `<text x="${cx}" y="${BASE + 22}" text-anchor="middle" font-size="12" fill="${m.current ? t.ink : t.faint}">${esc(m.label)}</text>`;
    return shape + value + label;
  });
  const summary = busiest
    ? `Busiest month: ${FULL_MONTHS[Number(busiest.key.slice(5)) - 1]} ${busiest.key.slice(0, 4)}, ${plural(busiest.total, 'contribution')}`
    : 'No contributions in the last 12 months';
  const css = `
text { font-family: ${FONT_SANS}; font-variant-numeric: tabular-nums; }
.bar { transform-box: fill-box; transform-origin: 50% 100%; animation: grow .8s cubic-bezier(.2, .7, .2, 1) backwards; }
.val { animation: fade .4s ease-out backwards; }
@keyframes grow { from { transform: scaleY(0); } }
@keyframes fade { from { opacity: 0; } }`;
  const body = `<text x="0" y="24" font-size="18" font-weight="600" fill="${t.ink}">Contributions per month</text>
<text x="0" y="46" font-size="13" fill="${t.faint}">Last 12 months, this month so far</text>
<path d="M0 ${BASE + 0.5}H${W}" stroke="${t.rule}"/>
${parts.join('\n')}
<text x="0" y="${H - 10}" font-size="13" fill="${t.slate}">${esc(summary)}</text>`;
  return svgDoc({ width: W, height: H, title: `Contributions per month. ${summary}`, css, body });
}
