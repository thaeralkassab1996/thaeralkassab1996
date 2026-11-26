import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../lib/theme.mjs';
import { renderHeader, PHRASES } from '../render/header.mjs';
import { renderLink } from '../render/links.mjs';
import { renderToolkit } from '../render/toolkit.mjs';

/** Tag-balance check: every opened element is closed in order, nothing left open. */
export function assertWellFormed(svg) {
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>\n?$/);
  assert.doesNotMatch(svg, /&(?!amp;|lt;|gt;|quot;|#\d+;)/, 'raw & in SVG');
  assert.doesNotMatch(svg, /NaN|undefined/);
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `unexpected </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], 'unclosed elements');
}

for (const name of ['light', 'dark']) {
  const t = THEMES[name];

  test(`header (${name}) is well formed and types every focus phrase`, () => {
    const svg = renderHeader(t);
    assertWellFormed(svg);
    assert.match(svg, /Thaer Alkassab/);
    assert.match(svg, /AI\/ML Engineer for LLM systems and Python backends/);
    for (const phrase of PHRASES) assert.ok(svg.includes(`>${phrase}</text>`), phrase);
    assert.match(svg, /animateMotion/);
    assert.ok(svg.includes(t.paper));
  });

  test(`link buttons (${name}) are well formed`, () => {
    for (const kind of ['portfolio', 'linkedin', 'email']) assertWellFormed(renderLink(kind, t));
    assert.match(renderLink('linkedin', t), />LinkedIn</);
  });

  test(`toolkit (${name}) is well formed and escapes group names`, () => {
    const svg = renderToolkit(t);
    assertWellFormed(svg);
    assert.match(svg, /AI &amp; LLMs/);
    assert.match(svg, />PyTorch Geometric</);
  });
}

test('light and dark variants differ', () => {
  assert.notEqual(renderHeader(THEMES.light), renderHeader(THEMES.dark));
  assert.notEqual(renderToolkit(THEMES.light), renderToolkit(THEMES.dark));
});

test('renderLink rejects unknown kinds', () => {
  assert.throws(() => renderLink('fax', THEMES.light), /unknown link/);
});
