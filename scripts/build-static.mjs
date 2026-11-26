// Draws the images that only change when the content changes: header, link buttons, toolkit.
// Run: node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES } from './lib/theme.mjs';
import { renderHeader } from './render/header.mjs';
import { LINKS, renderLink } from './render/links.mjs';
import { renderToolkit } from './render/toolkit.mjs';

const out = new URL('../assets/', import.meta.url);
mkdirSync(out, { recursive: true });
const write = (file, svg) => writeFileSync(new URL(file, out), svg);

for (const [name, theme] of Object.entries(THEMES)) {
  write(`header-${name}.svg`, renderHeader(theme));
  for (const kind of Object.keys(LINKS)) write(`link-${kind}-${name}.svg`, renderLink(kind, theme));
  write(`toolkit-${name}.svg`, renderToolkit(theme));
}
console.log('Wrote header, link and toolkit images to assets/');
