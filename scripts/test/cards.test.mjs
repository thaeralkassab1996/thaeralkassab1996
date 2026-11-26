import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../lib/theme.mjs';
import { computeStats, monthlyTotals } from '../lib/calendar.mjs';
import { windows, mergeDays } from '../lib/github.mjs';
import { renderStats } from '../render/stats.mjs';
import { renderActivity } from '../render/activity.mjs';
import { renderLanguages } from '../render/languages.mjs';
import { assertWellFormed } from './helpers.mjs';

function days(start, counts) {
  const t = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => ({ date: new Date(t + i * 86400000).toISOString().slice(0, 10), count }));
}

const QUIET = days('2025-11-27', Array(365).fill(0));
const BUSY = days('2025-11-27', Array.from({ length: 365 }, (_, i) => (i % 7 < 5 ? (i % 5) + 1 : 0)));

for (const name of ['light', 'dark']) {
  const t = THEMES[name];

  test(`stats card (${name}) renders a quiet calendar without broken values`, () => {
    const svg = renderStats(computeStats(QUIET), t);
    assertWellFormed(svg);
    assert.match(svg, />0</);
    assert.match(svg, /Current streak/);
    assert.match(svg, /Longest streak/);
  });

  test(`stats card (${name}) shows totals and streak dates`, () => {
    const stats = computeStats(BUSY);
    const svg = renderStats(stats, t);
    assertWellFormed(svg);
    assert.ok(svg.includes(`>${stats.total.toLocaleString('en-US')}<`));
    assert.match(svg, /since Nov 27, 2025/);
  });

  test(`activity card (${name}) draws twelve months`, () => {
    for (const cal of [QUIET, BUSY]) {
      const svg = renderActivity(monthlyTotals(cal), t);
      assertWellFormed(svg);
      for (const label of ['Dec', 'Jun', 'Nov']) assert.ok(svg.includes(`>${label}<`), label);
    }
    assert.match(renderActivity(monthlyTotals(QUIET), t), /No contributions in the last 12 months/);
    assert.match(renderActivity(monthlyTotals(BUSY), t), /Busiest month/);
  });

  test(`cards (${name}) say "1 contribution" and "1 day", not "1 contributions"`, () => {
    const one = days('2026-11-20', [0, 0, 1, 0]);
    const activity = renderActivity(monthlyTotals(one), t);
    assert.match(activity, /, 1 contribution</);
    const stats = renderStats(computeStats(one), t);
    assert.doesNotMatch(stats, /\b1 (contributions|days)\b/);
  });

  test(`languages card (${name}) escapes names and handles no data`, () => {
    const rows = [{ name: 'Python', lines: 600, pct: 60 }, { name: 'C & C++', lines: 400, pct: 40 }];
    const svg = renderLanguages(rows, { updated: '2026-11-26' }, t);
    assertWellFormed(svg);
    assert.match(svg, /C &amp; C\+\+/);
    assert.match(svg, /60\.0%/);
    assert.match(svg, /Updated November 2026/);
    assert.match(renderLanguages([], { updated: '2026-11-26' }, t), /No language data yet/);
  });

  test(`languages card (${name}) leaves a gap between bar segments so similar colours stay apart`, () => {
    const svg = renderLanguages([{ name: 'Python', lines: 6, pct: 60 }, { name: 'TypeScript', lines: 4, pct: 40 }], { updated: '2026-11-26' }, t);
    const segs = [...svg.matchAll(/class="seg"[^>]*? x="([\d.]+)"[^>]*? width="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    assert.equal(segs.length, 2);
    assert.ok(segs[1][0] - (segs[0][0] + segs[0][1]) >= 2, 'no gap between segments');
  });
}

test('windows splits the time since account creation into periods of at most a year', () => {
  assert.deepEqual(windows('2026-01-27T07:51:46Z', new Date('2026-11-26T12:00:00Z')), [
    { from: '2026-01-27T00:00:00.000Z', to: '2026-11-26T12:00:00.000Z' },
  ]);
  const w = windows('2024-05-01T10:00:00Z', new Date('2026-11-26T12:00:00Z'));
  assert.equal(w.length, 3);
  for (let i = 0; i < w.length; i += 1) {
    assert.ok(Date.parse(w[i].to) - Date.parse(w[i].from) < 365 * 86400000, `window ${i} is longer than a year`);
    if (i > 0) assert.equal(Date.parse(w[i].from) - Date.parse(w[i - 1].to), 1000);
  }
});

test('mergeDays sorts, removes duplicates and drops days before the account existed', () => {
  const merged = mergeDays(
    [
      [{ date: '2026-01-26', count: 0 }, { date: '2026-01-27', count: 2 }, { date: '2026-01-28', count: 0 }],
      [{ date: '2026-01-28', count: 3 }, { date: '2026-01-29', count: 1 }],
    ],
    '2026-01-27T07:51:46Z',
  );
  assert.deepEqual(merged, [
    { date: '2026-01-27', count: 2 },
    { date: '2026-01-28', count: 3 },
    { date: '2026-01-29', count: 1 },
  ]);
});
