// Redraws the contribution cards from the GitHub contribution calendar. Runs daily in GitHub
// Actions; locally it reads the calendar through the GitHub CLI.
// Run: node scripts/build-cards.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES } from './lib/theme.mjs';
import { computeStats, monthlyTotals } from './lib/calendar.mjs';
import { fetchCalendar } from './lib/github.mjs';
import { plural } from './lib/svg.mjs';
import { renderStats } from './render/stats.mjs';
import { renderActivity } from './render/activity.mjs';

const login = process.env.PROFILE_LOGIN || 'thaeralkassab1996';
const days = await fetchCalendar(login);
const stats = computeStats(days);
const months = monthlyTotals(days);

const out = new URL('../assets/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  writeFileSync(new URL(`stats-${name}.svg`, out), renderStats(stats, theme));
  writeFileSync(new URL(`activity-${name}.svg`, out), renderActivity(months, theme));
}
console.log(`${login}: ${plural(stats.total, 'contribution')} since ${stats.firstDate}, current streak ${plural(stats.current.length, 'day')}, longest ${plural(stats.longest.length, 'day')}`);
