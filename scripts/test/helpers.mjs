import assert from 'node:assert/strict';

/** Tag-balance check: every opened element is closed in order, nothing left open, no raw "&". */
export function assertWellFormed(svg) {
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>\n?$/);
  assert.doesNotMatch(svg, /&(?!amp;|lt;|gt;|quot;|#\d+;)/, 'raw & in SVG');
  assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `unexpected </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], 'unclosed elements');
}
