const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Escape text for use in SVG text content and attribute values. */
export const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/**
 * Approximate rendered width. Exact for monospace (0.6em per character); for the
 * proportional system font it is an estimate used for layout padding only.
 */
export function textWidth(text, size, kind = 'sans') {
  const chars = [...String(text)];
  if (kind === 'mono') return Math.round(chars.length * size * 0.6 * 100) / 100;
  let em = 0;
  for (const ch of chars) {
    if (/[iljtfrI.,:;'|!·\s]/.test(ch)) em += 0.32;
    else if (/[mwMW@&]/.test(ch)) em += 0.86;
    else if (/[A-Z0-9]/.test(ch)) em += 0.64;
    else em += 0.54;
  }
  return Math.round(em * size * 100) / 100;
}

export const fmtNumber = (n) => Number(n).toLocaleString('en-US');

/** "1 day", "2 days", "1,234 days" */
export const plural = (n, word) => `${fmtNumber(n)} ${word}${n === 1 ? '' : 's'}`;

function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, month: MONTHS[m - 1], d };
}

/** "2026-01-27" → "Jan 27, 2026" */
export function fmtDate(iso) {
  const { y, month, d } = parts(iso);
  return `${month} ${d}, ${y}`;
}

/** "2026-11-05" → "Nov 5" */
export function fmtShortDate(iso) {
  const { month, d } = parts(iso);
  return `${month} ${d}`;
}

export const monthLabel = (monthIndex) => MONTHS[monthIndex];

/** Wrap drawing code in a standalone, titled SVG document. */
export function svgDoc({ width, height, title, css = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
${css}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  .motion-only { display: none !important; }
}
</style>
${body}
</svg>
`;
}
