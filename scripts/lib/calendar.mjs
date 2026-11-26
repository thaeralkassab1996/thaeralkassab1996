import { monthLabel } from './svg.mjs';

const noStreak = () => ({ length: 0, start: null, end: null });

/**
 * Totals and streaks from a contribution calendar.
 * `days` is [{ date: 'YYYY-MM-DD', count }], one entry per day, oldest first; the last day is today.
 * A quiet today does not break the current streak: the day is not over yet.
 */
export function computeStats(days) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const first = days.find((d) => d.count > 0);
  const today = days.length ? days[days.length - 1].date : null;

  let longest = noStreak();
  let runStart = null;
  let runLength = 0;
  for (const d of days) {
    if (d.count > 0) {
      if (runLength === 0) runStart = d.date;
      runLength += 1;
      // ">=" keeps the most recent run when two are equally long.
      if (runLength >= longest.length) longest = { length: runLength, start: runStart, end: d.date };
    } else {
      runLength = 0;
    }
  }

  let current = noStreak();
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  if (i >= 0 && days[i].count > 0) {
    const end = days[i].date;
    let length = 0;
    while (i >= 0 && days[i].count > 0) {
      length += 1;
      i -= 1;
    }
    current = { length, start: days[i + 1].date, end };
  }

  return { total, firstDate: first ? first.date : null, today, current, longest };
}

/** Contributions per calendar month for the `months` months ending with today's month, oldest first. */
export function monthlyTotals(days, months = 12) {
  if (!days.length) return [];
  const [year, month] = days[days.length - 1].date.split('-').map(Number);
  const sums = new Map();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    sums.set(key, (sums.get(key) || 0) + d.count);
  }
  const out = [];
  for (let back = months - 1; back >= 0; back -= 1) {
    const first = new Date(Date.UTC(year, month - 1 - back, 1));
    const key = first.toISOString().slice(0, 7);
    out.push({ key, label: monthLabel(first.getUTCMonth()), total: sums.get(key) || 0, current: back === 0 });
  }
  return out;
}
