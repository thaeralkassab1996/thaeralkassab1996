import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readme = () => readFileSync(new URL('README.md', root), 'utf8');

test('every image the README uses exists in a light and a dark version', () => {
  const names = new Set([...readme().matchAll(/assets\/([a-z-]+)-(?:light|dark)\.svg/g)].map((m) => m[1]));
  for (const expected of ['header', 'link-portfolio', 'link-linkedin', 'link-email', 'toolkit', 'stats', 'activity', 'languages']) {
    assert.ok(names.has(expected), `README does not use ${expected}`);
  }
  for (const name of names) {
    for (const theme of ['light', 'dark']) assert.ok(existsSync(new URL(`assets/${name}-${theme}.svg`, root)), `${name}-${theme}.svg missing`);
  }
});

test('every picture has a dark-mode source and every image has alt text', () => {
  const text = readme();
  const pictures = text.match(/<picture>/g) || [];
  assert.equal(pictures.length, 8);
  assert.equal((text.match(/media="\(prefers-color-scheme: dark\)"/g) || []).length, pictures.length);
  for (const img of text.match(/<img [^>]*>/g)) assert.match(img, /alt="[^"]+"/, img);
});

test('README links to the portfolio, LinkedIn and email, and shows no phone number', () => {
  const text = readme();
  assert.ok(text.includes('https://thaeralkassab.netlify.app/'));
  assert.ok(text.includes('https://www.linkedin.com/in/thaeralkassab/'));
  assert.ok(text.includes('mailto:thaeralkassab1996@gmail.com'));
  assert.doesNotMatch(text, /tel:|\+31|6591/);
});
