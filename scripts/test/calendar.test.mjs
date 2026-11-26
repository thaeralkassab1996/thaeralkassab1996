import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, monthlyTotals } from '../lib/calendar.mjs';

/** Consecutive days starting at `start`, one per count. */
function days(start, counts) {
  const t = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => ({ date: new Date(t + i * 86400000).toISOString().slice(0, 10), count }));
}

test('an empty calendar has no total, no first date and no streaks', () => {
  const s = computeStats(days('2026-11-20', [0, 0, 0, 0]));
  assert.equal(s.total, 0);
  assert.equal(s.firstDate, null);
  assert.equal(s.today, '2026-11-23');
  assert.deepEqual(s.current, { length: 0, start: null, end: null });
  assert.deepEqual(s.longest, { length: 0, start: null, end: null });
});

test('a quiet today does not break the current streak', () => {
  const s = computeStats(days('2026-11-20', [0, 5, 3, 0]));
  assert.deepEqual(s.current, { length: 2, start: '2026-11-21', end: '2026-11-22' });
});

test('the current streak runs through today when today is active', () => {
  const s = computeStats(days('2026-11-20', [2, 0, 1, 1, 1]));
  assert.deepEqual(s.current, { length: 3, start: '2026-11-22', end: '2026-11-24' });
});

test('two quiet days in a row end the current streak', () => {
  const s = computeStats(days('2026-11-20', [4, 4, 0, 0]));
  assert.deepEqual(s.current, { length: 0, start: null, end: null });
});

test('the longest streak is the longest run, the most recent one on a tie', () => {
  const s = computeStats(days('2026-11-01', [1, 1, 1, 0, 2, 2, 0, 3, 3, 3, 0]));
  assert.deepEqual(s.longest, { length: 3, start: '2026-11-08', end: '2026-11-10' });
  assert.equal(computeStats(days('2026-11-01', [1, 1, 1, 1, 0, 2, 2])).longest.length, 4);
});

test('the total sums every day and the first date skips leading quiet days', () => {
  const s = computeStats(days('2026-01-20', [0, 0, 3, 0, 4]));
  assert.equal(s.total, 7);
  assert.equal(s.firstDate, '2026-01-22');
});

test('monthlyTotals returns twelve zero-filled months ending with the current one', () => {
  const cal = [
    { date: '2025-12-03', count: 2 },
    { date: '2026-03-10', count: 5 },
    { date: '2026-03-11', count: 1 },
    { date: '2026-11-26', count: 4 },
  ];
  const months = monthlyTotals(cal);
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], { key: '2025-12', label: 'Dec', total: 2, current: false });
  assert.deepEqual(months[3], { key: '2026-03', label: 'Mar', total: 6, current: false });
  assert.equal(months[5].total, 0);
  assert.deepEqual(months[11], { key: '2026-11', label: 'Nov', total: 4, current: true });
  assert.equal(months.filter((m) => m.current).length, 1);
});
