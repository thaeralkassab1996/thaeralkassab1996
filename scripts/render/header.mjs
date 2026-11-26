// Animated profile header: name and role on the left, a small graph on the right where signals
// travel along edges into hub nodes (message passing, as in a graph neural network).
import { FONT_SANS, FONT_MONO } from '../lib/theme.mjs';
import { esc, svgDoc } from '../lib/svg.mjs';

export const PHRASES = [
  'conversational AI',
  'retrieval-augmented generation',
  'model evaluation',
  'LLM orchestration',
  'explainable AI for graph neural networks',
];

const W = 1200;
const H = 300;
const PERIOD = 6; // seconds per message-passing round
const SPEED = 150; // signal speed, px per second
const HUB_ARRIVALS = [0.25, 0.5, 0.75]; // when each hub receives its messages, as a fraction of PERIOD

// Typed line: 20px monospace, so every character is 12px wide (textLength enforces it).
const TYPE_X = 92;
const TYPE_Y = 262;
const CHAR = 12;
const TYPE_STEP = 0.05;
const DELETE_STEP = 0.024;
const HOLD = 1.9;
const GAP = 0.4;

const r2 = (n) => Math.round(n * 100) / 100;
const f4 = (n) => (Math.round(n * 10000) / 10000).toString();

/** Deterministic pseudo-random numbers (mulberry32), so every build draws the same graph. */
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nodes spread over the right side, each linked to its two nearest neighbours; three hubs. */
export function buildGraph(seed = 20260127) {
  const rand = random(seed);
  const nodes = [];
  for (let tries = 0; nodes.length < 26 && tries < 6000; tries += 1) {
    const x = 648 + rand() * 516;
    const y = 34 + rand() * 232;
    if (nodes.every((n) => Math.hypot(n.x - x, n.y - y) >= 60)) nodes.push({ x: Math.round(x), y: Math.round(y), r: r2(3 + rand() * 1.8) });
  }
  const dist = (a, b) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
  const nearest = (i, k) => nodes.map((_, j) => j).filter((j) => j !== i).sort((a, b) => dist(i, a) - dist(i, b)).slice(0, k);
  const edges = new Map();
  const link = (a, b) => edges.set(a < b ? `${a}-${b}` : `${b}-${a}`, [Math.min(a, b), Math.max(a, b)]);
  nodes.forEach((_, i) => nearest(i, 2).forEach((j) => link(i, j)));

  const anchors = [[770, 168], [930, 92], [1080, 200]];
  const hubs = anchors.map(([ax, ay]) => nodes.map((n, i) => [Math.hypot(n.x - ax, n.y - ay), i]).sort((a, b) => a[0] - b[0])[0][1]);
  const neighbours = new Map();
  for (const hub of hubs) {
    const near = nearest(hub, 4).filter((j) => !hubs.includes(j));
    near.forEach((j) => link(hub, j));
    neighbours.set(hub, near);
  }
  return { nodes, edges: [...edges.values()], hubs, neighbours, dist };
}

/** Signals: three neighbours send to a hub so they arrive together, then the hub passes one on. */
function buildSignals(graph) {
  const signals = [];
  graph.hubs.forEach((hub, h) => {
    const arrive = HUB_ARRIVALS[h];
    const [out, ...ins] = graph.neighbours.get(hub);
    for (const from of ins.slice(0, 3)) {
      const travel = graph.dist(from, hub) / SPEED / PERIOD;
      signals.push({ from, to: hub, start: arrive - travel, end: arrive });
    }
    if (out !== undefined) {
      const travel = graph.dist(hub, out) / SPEED / PERIOD;
      signals.push({ from: hub, to: out, start: arrive + 0.02, end: arrive + 0.02 + travel });
    }
  });
  return signals;
}

function haloKeyframes(name, arrivals) {
  const stops = ['0% { opacity: 0; }'];
  for (const a of [...arrivals].sort((x, y) => x - y)) {
    const p = a * 100;
    stops.push(`${f4(p - 0.4)}% { opacity: 0; }`, `${f4(p)}% { opacity: .6; }`, `${f4(Math.min(p + 7, 99.9))}% { opacity: 0; }`);
  }
  stops.push('100% { opacity: 0; }');
  return `@keyframes ${name} { ${stops.join(' ')} }`;
}

function drawGraph(t, graph) {
  const { nodes, edges, hubs } = graph;
  const signals = buildSignals(graph);
  const arrivals = new Map();
  for (const s of signals) arrivals.set(s.to, [...(arrivals.get(s.to) || []), s.end]);

  const css = [];
  const halos = [];
  for (const [i, times] of arrivals) {
    const n = nodes[i];
    const hub = hubs.includes(i);
    css.push(haloKeyframes(`pulse${i}`, times), `.halo${i} { animation: pulse${i} ${PERIOD}s linear infinite; }`);
    halos.push(`<circle class="halo${i}" cx="${n.x}" cy="${n.y}" r="${hub ? 14 : 9}" fill="${hub ? t.magenta : t.blue}" opacity="0"/>`);
  }

  const edgePath = edges.map(([a, b]) => `M${nodes[a].x} ${nodes[a].y}L${nodes[b].x} ${nodes[b].y}`).join('');
  const dots = nodes
    .map((n, i) => (hubs.includes(i)
      ? `<circle cx="${n.x}" cy="${n.y}" r="11" fill="none" stroke="${t.magenta}" stroke-opacity=".35" stroke-width="1.5"/><circle cx="${n.x}" cy="${n.y}" r="6.5" fill="${t.magenta}"/>`
      : `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${t.blue}" fill-opacity=".85"/>`))
    .join('');
  const moving = signals
    .map((s) => {
      const a = nodes[s.from];
      const b = nodes[s.to];
      const color = hubs.includes(s.to) ? t.magenta : t.blue;
      return `<circle r="2.8" fill="${color}" opacity="0">`
        + `<animateMotion dur="${PERIOD}s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;${f4(s.start)};${f4(s.end)};1" path="M${a.x},${a.y} L${b.x},${b.y}"/>`
        + `<animate attributeName="opacity" dur="${PERIOD}s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;${f4(s.start)};${f4(s.end)}"/>`
        + '</circle>';
    })
    .join('');

  const body = `<g mask="url(#fade)"><g class="drift">`
    + `<path d="${edgePath}" fill="none" stroke="${t.ruleStrong}" stroke-width="1.2"/>`
    + halos.join('')
    + dots
    + `<g class="motion-only">${moving}</g>`
    + '</g></g>';
  return { css: css.join('\n'), body };
}

/** Per-character steps for the typed line, as SMIL discrete values. */
function typingTimeline() {
  let t = 0.4;
  const slots = PHRASES.map((text) => {
    const n = text.length;
    const slot = { text, n, start: t, held: t + n * TYPE_STEP + HOLD };
    slot.deleted = slot.held + n * DELETE_STEP;
    t = slot.deleted + GAP;
    return slot;
  });
  return { slots, total: t };
}

function stepAnimation(attr, slot, total, offset) {
  const times = [0, slot.start];
  const values = [offset, offset];
  for (let k = 1; k <= slot.n; k += 1) {
    times.push(slot.start + k * TYPE_STEP);
    values.push(offset + k * CHAR);
  }
  for (let k = 1; k <= slot.n; k += 1) {
    times.push(slot.held + k * DELETE_STEP);
    values.push(offset + (slot.n - k) * CHAR);
  }
  return `<animate attributeName="${attr}" dur="${f4(total)}s" repeatCount="indefinite" calcMode="discrete" values="${values.join(';')}" keyTimes="${times.map((x) => f4(x / total)).join(';')}"/>`;
}

function drawTyping(t) {
  const { slots, total } = typingTimeline();
  const clips = [];
  const lines = [];
  const carets = [];
  slots.forEach((slot, i) => {
    clips.push(`<clipPath id="type${i}"><rect x="${TYPE_X}" y="${TYPE_Y - 22}" width="0" height="30">${stepAnimation('width', slot, total, 0)}</rect></clipPath>`);
    lines.push(`<text class="mono" x="${TYPE_X}" y="${TYPE_Y}" font-size="20" fill="${t.ink}" textLength="${slot.n * CHAR}" lengthAdjust="spacing" clip-path="url(#type${i})">${esc(slot.text)}</text>`);
    const caretOff = slot.deleted + GAP / 2;
    carets.push(
      `<rect x="${TYPE_X}" y="${TYPE_Y - 18}" width="2" height="22" fill="${t.magenta}" opacity="0">${stepAnimation('x', slot, total, TYPE_X)}`
        + `<animate attributeName="opacity" dur="${f4(total)}s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;${f4(slot.start / total)};${f4(caretOff / total)}"/></rect>`,
    );
  });
  const first = slots[0];
  const still = `<text class="mono still" x="${TYPE_X}" y="${TYPE_Y}" font-size="20" fill="${t.ink}" textLength="${first.n * CHAR}" lengthAdjust="spacing">${esc(first.text)}</text>`;
  return {
    defs: clips.join(''),
    body: `<text class="mono" x="64" y="${TYPE_Y}" font-size="20" fill="${t.blue}">›</text>`
      + `<g class="motion-only">${lines.join('')}<g class="caret">${carets.join('')}</g></g>`
      + still,
  };
}

export function renderHeader(t) {
  const graph = drawGraph(t, buildGraph());
  const typing = drawTyping(t);
  const css = `
.sans { font-family: ${FONT_SANS}; }
.mono { font-family: ${FONT_MONO}; }
.drift { animation: drift 16s ease-in-out infinite alternate; }
@keyframes drift { from { transform: translate(0, 0); } to { transform: translate(-18px, 8px); } }
.caret { animation: blink 1.1s steps(1, end) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.still { display: none; }
@media (prefers-reduced-motion: reduce) { .still { display: inline; } }
${graph.css}`;
  const body = `<defs>
<linearGradient id="fadeRamp" x1="596" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fadeRamp)"/></mask>
${typing.defs}
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.paper}" stroke="${t.rule}"/>
${graph.body}
<text class="sans" x="64" y="102" font-size="22" fill="${t.slate}">Hi, I'm</text>
<text class="sans" x="62" y="168" font-size="64" font-weight="700" letter-spacing="-1.5" fill="${t.ink}">Thaer Alkassab</text>
<text class="sans" x="64" y="212" font-size="22" fill="${t.slate}">AI/ML Engineer for LLM systems and Python backends</text>
${typing.body}`;
  return svgDoc({ width: W, height: H, title: 'Thaer Alkassab, AI/ML Engineer for LLM systems and Python backends', css, body });
}
