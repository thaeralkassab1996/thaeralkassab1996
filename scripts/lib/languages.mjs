// Language mix from `git log --numstat` output: lines added plus removed per language.

const EXTENSIONS = {
  py: 'Python', pyi: 'Python', ipynb: 'Jupyter Notebook',
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'CSS', sass: 'CSS', less: 'CSS',
  sql: 'SQL', sh: 'Shell', bash: 'Shell', zsh: 'Shell', ps1: 'PowerShell', psm1: 'PowerShell',
  go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', c: 'C', h: 'C', cc: 'C++', cpp: 'C++',
  cxx: 'C++', hpp: 'C++', cs: 'C#', rb: 'Ruby', php: 'PHP', swift: 'Swift', vue: 'Vue',
  svelte: 'Svelte', r: 'R', dart: 'Dart', lua: 'Lua', tf: 'HCL',
};

const LOCKFILES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'uv.lock', 'poetry.lock',
  'Pipfile.lock', 'Cargo.lock', 'composer.lock', 'Gemfile.lock',
]);

// Generated files that would otherwise count as code: Supabase types, bundle size reports.
const GENERATED_FILES = new Set(['database.types.ts', 'stats.html']);

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', '.next', '.turbo', '.cache', 'vendor', 'coverage',
  '__snapshots__', '.venv', 'venv', 'site-packages', 'generated', '__generated__',
]);

/** Language of a repository path, or null for files that should not count. */
export function languageOf(path) {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  if (LOCKFILES.has(name) || GENERATED_FILES.has(name)) return null;
  if (parts.slice(0, -1).some((dir) => IGNORED_DIRS.has(dir))) return null;
  if (/(^|\/)js\/lang\//.test(path)) return null; // translation data
  if (/\.min\.[a-z0-9]+$/i.test(name) || /\.d\.ts$/i.test(name) || /\.generated\./i.test(name)) return null;
  if (/^Dockerfile(\..+)?$/i.test(name) || /\.dockerfile$/i.test(name)) return 'Dockerfile';
  if (name === 'Makefile') return 'Makefile';
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return null;
  return EXTENSIONS[name.slice(dot + 1).toLowerCase()] || null;
}

/** numstat shows renames as "src/{old => new}/f.py" or "old.py => new.py": keep the new path. */
function newPath(path) {
  if (path.includes('{') && path.includes(' => ')) {
    return path.replace(/\{[^{}]*? => ([^{}]*)\}/, '$1').replace(/\/{2,}/g, '/');
  }
  return path.includes(' => ') ? path.split(' => ').pop() : path;
}

/**
 * Add the lines added in one repository's `git log --numstat --format=commit:%H` output to
 * `totals`. Removed lines do not count: deleting an old template is not writing that language.
 * Commits already in `seen` are skipped, so a commit present in two clones counts once.
 */
export function sumNumstat(text, totals = new Map(), seen = new Set()) {
  let skip = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('commit:')) {
      const hash = line.slice('commit:'.length).trim();
      skip = seen.has(hash);
      seen.add(hash);
      continue;
    }
    if (skip) continue;
    const m = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(line);
    if (!m || m[1] === '-') continue;
    const language = languageOf(newPath(m[3]));
    if (!language || Number(m[1]) === 0) continue;
    totals.set(language, (totals.get(language) || 0) + Number(m[1]));
  }
  return totals;
}

/** Top `top` languages by lines plus "Other", with percentages to one decimal that add up to 100. */
export function shares(totals, top = 6) {
  const entries = [...totals.entries()]
    .filter(([, lines]) => lines > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!entries.length) return [];
  const sum = entries.reduce((s, [, lines]) => s + lines, 0);
  const rows = entries.slice(0, top).map(([name, lines]) => ({ name, lines }));
  const rest = entries.slice(top).reduce((s, [, lines]) => s + lines, 0);
  if (rest > 0) rows.push({ name: 'Other', lines: rest });

  // Largest-remainder rounding in tenths of a percent.
  const exact = rows.map((r) => (r.lines / sum) * 1000);
  const tenths = exact.map(Math.floor);
  let left = 1000 - tenths.reduce((s, n) => s + n, 0);
  const byRemainder = exact.map((v, i) => [v - tenths[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of byRemainder) {
    if (left <= 0) break;
    tenths[i] += 1;
    left -= 1;
  }
  return rows.map((r, i) => ({ ...r, pct: tenths[i] / 10 }));
}

/** GitHub (linguist) language colours. */
export const LANGUAGE_COLORS = {
  Python: '#3572A5', TypeScript: '#3178C6', JavaScript: '#F1E05A', HTML: '#E34C26', CSS: '#663399',
  SQL: '#E38C00', Shell: '#89E051', PowerShell: '#012456', Dockerfile: '#384D54',
  'Jupyter Notebook': '#DA5B0B', Go: '#00ADD8', Rust: '#DEA584', Java: '#B07219', Kotlin: '#A97BFF',
  C: '#555555', 'C++': '#F34B7D', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138',
  Vue: '#41B883', Svelte: '#FF3E00', R: '#198CE7', Dart: '#00B4AB', Lua: '#000080', HCL: '#844FBA',
  Makefile: '#427819',
};

// Colours too dark to see on the dark card background.
const DARK_OVERRIDES = {
  PowerShell: '#5391FE', Dockerfile: '#7FA3B5', C: '#A0A7B2', Ruby: '#D0464A', Lua: '#6D7DFF',
  CSS: '#9B6FD6',
};

export function colorFor(name, themeName = 'light') {
  if (name === 'Other') return themeName === 'dark' ? '#4A5A72' : '#B8C2CF';
  if (themeName === 'dark' && DARK_OVERRIDES[name]) return DARK_OVERRIDES[name];
  return LANGUAGE_COLORS[name] || '#8B98A9';
}
