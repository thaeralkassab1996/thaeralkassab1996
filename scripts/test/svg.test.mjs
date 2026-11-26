import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, textWidth, fmtNumber, fmtDate, fmtShortDate, svgDoc } from '../lib/svg.mjs';
import { THEMES } from '../lib/theme.mjs';

test('esc escapes the characters that break SVG markup', () => {
  assert.equal(esc('AI & <LLMs> "x"'), 'AI &amp; &lt;LLMs&gt; &quot;x&quot;');
  assert.equal(esc("it's"), 'it&#39;s');
});

test('fmtNumber adds thousands separators', () => {
  assert.equal(fmtNumber(1234), '1,234');
  assert.equal(fmtNumber(0), '0');
});

test('fmtDate and fmtShortDate print GitHub-style dates', () => {
  assert.equal(fmtDate('2026-01-27'), 'Jan 27, 2026');
  assert.equal(fmtShortDate('2026-11-05'), 'Nov 5');
});

test('textWidth uses 0.6em per character for monospace text', () => {
  assert.equal(textWidth('abcd', 20, 'mono'), 48);
  assert.ok(textWidth('abcd', 20) < 48);
});

test('svgDoc wraps the body in a titled SVG that respects reduced motion', () => {
  const out = svgDoc({ width: 10, height: 20, title: 'A & B', css: '.x{fill:red}', body: '<rect/>' });
  assert.match(out, /^<svg /);
  assert.match(out, /viewBox="0 0 10 20"/);
  assert.match(out, /<title>A &amp; B<\/title>/);
  assert.match(out, /prefers-reduced-motion/);
  assert.match(out, /<\/svg>\n?$/);
});

test('both themes define the same colour tokens', () => {
  const keys = ['paper', 'surface', 'sunken', 'ink', 'slate', 'faint', 'rule', 'ruleStrong', 'blue', 'blueSoft', 'magenta', 'magentaSoft'];
  for (const name of ['light', 'dark']) {
    for (const key of keys) assert.match(THEMES[name][key], /^#[0-9A-F]{6}$/i, `${name}.${key}`);
  }
});
