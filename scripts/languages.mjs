// Redraws the languages card from your own commits in local clones. Runs on your machine only:
// list one repository folder per line in scripts/repos.local.txt (git-ignored, so the names of
// private repositories never reach GitHub). Only language percentages end up in the image.
// Run: node scripts/languages.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { THEMES } from './lib/theme.mjs';
import { shares, sumNumstat } from './lib/languages.mjs';
import { renderLanguages } from './render/languages.mjs';

const AUTHOR = process.env.LANGUAGES_AUTHOR || 'thaer';
const listFile = new URL('./repos.local.txt', import.meta.url);
if (!existsSync(listFile)) {
  console.error('Create scripts/repos.local.txt with one local repository folder per line.');
  process.exit(1);
}
const repos = readFileSync(listFile, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

// Only the default branch: feature-branch commits that were later squash-merged would
// otherwise count twice.
function defaultBranch(repo) {
  try {
    execFileSync('git', ['-C', repo, 'rev-parse', '--verify', '--quiet', 'origin/HEAD'], { stdio: 'ignore' });
    return 'origin/HEAD';
  } catch {
    return 'HEAD';
  }
}

const totals = new Map();
const seen = new Set();
for (const repo of repos) {
  const log = execFileSync(
    'git',
    ['-C', repo, 'log', defaultBranch(repo), '--no-merges', '--since=12 months ago', '--regexp-ignore-case', `--author=${AUTHOR}`, '--numstat', '--format=commit:%H'],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 },
  );
  sumNumstat(log, totals, seen);
}

const rows = shares(totals);
const updated = new Date().toISOString().slice(0, 10);
const out = new URL('../assets/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  writeFileSync(new URL(`languages-${name}.svg`, out), renderLanguages(rows, { updated }, theme));
}
console.log(`${seen.size} commits from ${repos.length} repositories`);
for (const r of rows) console.log(`${r.name.padEnd(18)} ${r.pct.toFixed(1).padStart(5)}%  (${r.lines} lines)`);
