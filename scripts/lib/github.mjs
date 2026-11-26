// Reads a user's contribution calendar from the GitHub GraphQL API. In GitHub Actions it uses
// GITHUB_TOKEN; locally it goes through the GitHub CLI, which handles sign-in.
import { execFileSync } from 'node:child_process';

const DAY = 86400000;

const USER_QUERY = 'query($login: String!) { user(login: $login) { createdAt } }';
const CALENDAR_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

async function graphql(query, variables) {
  const token = process.env.GITHUB_TOKEN;
  let json;
  if (token) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
      body: JSON.stringify({ query, variables }),
    });
    json = await res.json();
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}: ${json.message || 'no message'}`);
  } else {
    const args = ['api', 'graphql', '-f', `query=${query}`];
    for (const [key, value] of Object.entries(variables)) args.push('-f', `${key}=${value}`);
    json = JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
  }
  if (json.errors) throw new Error(`GitHub API error: ${json.errors.map((e) => e.message).join('; ')}`);
  return json.data;
}

/** Whole-day periods of less than a year (the API's limit) from the account's first day to `now`. */
export function windows(createdAt, now = new Date()) {
  let from = Date.parse(`${createdAt.slice(0, 10)}T00:00:00Z`);
  const end = now.getTime();
  const out = [];
  while (from <= end) {
    const to = Math.min(from + 365 * DAY - 1000, end);
    out.push({ from: new Date(from).toISOString(), to: new Date(to).toISOString() });
    from = to + 1000;
  }
  return out;
}

/** One entry per day, oldest first, nothing before the account existed. */
export function mergeDays(chunks, createdAt) {
  const first = createdAt.slice(0, 10);
  const byDate = new Map();
  for (const chunk of chunks) {
    for (const d of chunk) {
      if (d.date >= first) byDate.set(d.date, Math.max(byDate.get(d.date) || 0, d.count));
    }
  }
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
}

export async function fetchCalendar(login, now = new Date()) {
  const { user } = await graphql(USER_QUERY, { login });
  if (!user) throw new Error(`GitHub user not found: ${login}`);
  const chunks = [];
  for (const w of windows(user.createdAt, now)) {
    const data = await graphql(CALENDAR_QUERY, { login, from: w.from, to: w.to });
    const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
    chunks.push(weeks.flatMap((week) => week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))));
  }
  return mergeDays(chunks, user.createdAt);
}
