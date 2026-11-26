import { test } from 'node:test';
import assert from 'node:assert/strict';
import { languageOf, sumNumstat, shares, colorFor } from '../lib/languages.mjs';

test('languageOf maps source files to languages', () => {
  assert.equal(languageOf('api/app.py'), 'Python');
  assert.equal(languageOf('web/src/Page.tsx'), 'TypeScript');
  assert.equal(languageOf('js/main.js'), 'JavaScript');
  assert.equal(languageOf('db/001_init.sql'), 'SQL');
  assert.equal(languageOf('index.html'), 'HTML');
  assert.equal(languageOf('css/styles.css'), 'CSS');
  assert.equal(languageOf('scripts/run.sh'), 'Shell');
  assert.equal(languageOf('Dockerfile'), 'Dockerfile');
  assert.equal(languageOf('services/api/Dockerfile.dev'), 'Dockerfile');
});

test('languageOf ignores lockfiles, generated, vendored, data and docs files', () => {
  for (const path of [
    'package-lock.json', 'web/pnpm-lock.yaml', 'uv.lock', 'node_modules/x/index.js', 'web/dist/app.js',
    'web/.next/server.js', 'docs/guide.md', 'config/app.yml', 'data/rows.json', 'js/lang/nl.js',
    'static/app.min.js', 'types/env.d.ts', 'img/logo.png', 'README', 'src/api.generated.ts',
  ]) {
    assert.equal(languageOf(path), null, path);
  }
});

const SAMPLE = [
  'commit:aaa',
  '',
  '10\t2\tapi/app.py',
  '-\t-\timg/logo.png',
  '3\t1\tweb/x.tsx',
  '5\t0\tpackage-lock.json',
  '2\t2\tsrc/{old => new}/mod.py',
  'commit:bbb',
  '',
  '1\t1\tapi/util.py',
].join('\n');

test('sumNumstat adds lines added and removed per language, skipping binary and ignored files', () => {
  const totals = sumNumstat(SAMPLE);
  assert.equal(totals.get('Python'), 18);
  assert.equal(totals.get('TypeScript'), 4);
  assert.equal(totals.size, 2);
});

test('sumNumstat counts a commit once even when two clones contain it', () => {
  const seen = new Set();
  const totals = sumNumstat(SAMPLE, new Map(), seen);
  sumNumstat(SAMPLE, totals, seen);
  assert.equal(totals.get('Python'), 18);
});

test('shares sorts by size, keeps the top languages and folds the rest into Other', () => {
  const rows = shares(new Map([['Python', 600], ['TypeScript', 300], ['CSS', 50], ['HTML', 30], ['SQL', 15], ['Shell', 3], ['Dockerfile', 2]]), 6);
  assert.deepEqual(rows.map((r) => [r.name, r.pct]), [
    ['Python', 60], ['TypeScript', 30], ['CSS', 5], ['HTML', 3], ['SQL', 1.5], ['Shell', 0.3], ['Other', 0.2],
  ]);
});

test('shares always add up to exactly 100 percent', () => {
  const rows = shares(new Map([['A', 1], ['B', 1], ['C', 1]]));
  assert.equal(Math.round(rows.reduce((s, r) => s + r.pct, 0) * 10) / 10, 100);
  assert.deepEqual(shares(new Map()), []);
});

test('colorFor uses GitHub language colours and keeps dark ones visible on dark backgrounds', () => {
  assert.equal(colorFor('Python', 'light'), '#3572A5');
  assert.notEqual(colorFor('Dockerfile', 'dark'), colorFor('Dockerfile', 'light'));
  assert.match(colorFor('Something new', 'light'), /^#[0-9A-F]{6}$/i);
});
