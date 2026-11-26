// Link buttons for the README: Portfolio (primary), LinkedIn, Email.
import { FONT_SANS } from '../lib/theme.mjs';
import { esc, svgDoc, textWidth } from '../lib/svg.mjs';

const ICONS = {
  globe: (c) => `<g fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9M12 3c-2.6 2.6-3.9 5.6-3.9 9s1.3 6.4 3.9 9"/></g>`,
  linkedin: (c) => `<path fill="${c}" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z"/>`,
  mail: (c) => `<g fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></g>`,
};

export const LINKS = {
  portfolio: { label: 'Portfolio', icon: 'globe', primary: true },
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  email: { label: 'Email', icon: 'mail' },
};

export function renderLink(kind, t) {
  const link = LINKS[kind];
  if (!link) throw new Error(`unknown link: ${kind}`);
  const h = 40;
  const size = 15;
  const icon = 18;
  const padX = 16;
  const gap = 9;
  const w = Math.ceil(padX + icon + gap + textWidth(link.label, size) + padX + 2);
  const onAccent = t.name === 'dark' ? '#07101D' : '#FFFFFF';
  const text = link.primary ? onAccent : t.ink;
  const iconColor = link.primary ? onAccent : t.blue;
  const box = link.primary
    ? `<rect width="${w}" height="${h}" rx="10" fill="${t.blue}"/>`
    : `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="9.25" fill="none" stroke="${t.ruleStrong}" stroke-width="1.5"/>`;
  const body = `${box}<g transform="translate(${padX} ${(h - icon) / 2}) scale(${icon / 24})">${ICONS[link.icon](iconColor)}</g>`
    + `<text x="${padX + icon + gap}" y="${h / 2 + 5}" font-size="${size}" font-weight="600" fill="${text}">${esc(link.label)}</text>`;
  return svgDoc({ width: w, height: h, title: link.label, css: `text { font-family: ${FONT_SANS}; }`, body });
}
