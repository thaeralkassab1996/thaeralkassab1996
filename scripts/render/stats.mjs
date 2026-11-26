// Contribution totals and streaks: three figures separated by hairlines, the current streak in a ring.
import { FONT_SANS } from '../lib/theme.mjs';
import { esc, fmtDate, fmtNumber, fmtShortDate, plural, svgDoc } from '../lib/svg.mjs';

const W = 1000;
const H = 200;
const RING_R = 48;
const RING_C = Math.round(2 * Math.PI * RING_R * 100) / 100;

function range({ start, end }) {
  if (start.slice(0, 4) !== end.slice(0, 4)) return `${fmtDate(start)} – ${fmtDate(end)}`;
  return start === end ? fmtShortDate(start) : `${fmtShortDate(start)} – ${fmtShortDate(end)}`;
}

function column(cx, value, label, sub, labelColor, t, delay) {
  return `<g class="fig" style="animation-delay:${delay}ms">`
    + `<text x="${cx}" y="98" text-anchor="middle" font-size="46" font-weight="700" fill="${t.ink}">${esc(value)}</text>`
    + `<text x="${cx}" y="160" text-anchor="middle" font-size="16" font-weight="600" fill="${labelColor}">${esc(label)}</text>`
    + `<text x="${cx}" y="184" text-anchor="middle" font-size="14" fill="${t.faint}">${esc(sub)}</text>`
    + '</g>';
}

export function renderStats(stats, t) {
  const { total, firstDate, current, longest } = stats;
  const totalSub = firstDate ? `since ${fmtDate(firstDate)}` : 'None yet';
  const currentSub = current.length ? range(current) : 'Starts with the next contribution';
  const longestSub = longest.length ? range(longest) : 'No streak yet';
  const css = `
text { font-family: ${FONT_SANS}; font-variant-numeric: tabular-nums; }
.fig { animation: rise .6s cubic-bezier(.2, .7, .2, 1) backwards; }
.ring { animation: draw 1.2s cubic-bezier(.3, .7, .2, 1) .15s backwards; }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes draw { from { stroke-dashoffset: ${RING_C}; } }`;
  const body = `<path d="M333.5 30V180M666.5 30V180" stroke="${t.rule}"/>
<circle cx="500" cy="82" r="${RING_R}" fill="none" stroke="${t.rule}" stroke-width="5"/>
<circle class="ring" cx="500" cy="82" r="${RING_R}" fill="none" stroke="${t.magenta}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0" transform="rotate(-90 500 82)"/>
${column(167, fmtNumber(total), 'Contributions', totalSub, t.ink, t, 0)}
${column(500, String(current.length), 'Current streak', currentSub, t.magenta, t, 120)}
${column(833, String(longest.length), 'Longest streak', longestSub, t.ink, t, 240)}`;
  const title = `${plural(total, 'contribution')} ${totalSub}; current streak ${plural(current.length, 'day')}; longest streak ${plural(longest.length, 'day')}`;
  return svgDoc({ width: W, height: H, title, css, body });
}
