// scripts/release.js decides releases from Conventional Commits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpOf, nextVersion, releaseChangelog } from '../scripts/release.js';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'release.js');

test('commit types map to release weights', () => {
  assert.equal(bumpOf('feat(board): multi-repo view'), 'minor');
  assert.equal(bumpOf('fix(parse): ignore code blocks'), 'patch');
  assert.equal(bumpOf('perf: cache worktree list'), 'patch');
  assert.equal(bumpOf('feat!: drop Node 18'), 'major');
  assert.equal(bumpOf('refactor: rename\n\nBREAKING CHANGE: buildBoard is async'), 'major');
  assert.equal(bumpOf('docs: README restructured'), null);
  assert.equal(bumpOf('chore(release): 0.2.1 and release procedure (#13)'), null);
  assert.equal(bumpOf('Merge branch main'), null);
});

test('only feat, fix, perf and breaking changes release', () => {
  assert.equal(nextVersion('0.2.1', ['docs: a', 'chore: b', 'ci: c', 'test: d']), null);
  assert.equal(nextVersion('0.2.1', ['docs: a', 'fix: b']), '0.2.2');
  assert.equal(nextVersion('0.2.1', ['fix: a', 'feat: b']), '0.3.0');
  assert.equal(nextVersion('0.2.1', ['feat!: a']), '0.3.0', 'before 1.0 a breaking change bumps minor');
  assert.equal(nextVersion('1.4.2', ['feat!: a']), '2.0.0');
  assert.equal(nextVersion('1.4.2', []), null);
});

const CHANGELOG = `# Changelog

Intro.

## [Unreleased]

### Added
- Multi-repo view.

## [0.2.1] - 2026-10-31

### Fixed
- Old fix.
`;

test('Unreleased entries move under the new version', () => {
  const { changelog, notes } = releaseChangelog(CHANGELOG, '0.3.0', '2026-11-02');
  assert.equal(notes, '### Added\n- Multi-repo view.');
  assert.match(changelog, /## \[Unreleased\]\n\n## \[0\.3\.0\] - 2026-11-02\n\n### Added\n- Multi-repo view\.\n\n## \[0\.2\.1\]/);
  assert.match(changelog, /### Fixed\n- Old fix\.\n$/);
});

test('an empty Unreleased section is filled from commit subjects', () => {
  const empty = CHANGELOG.replace('### Added\n- Multi-repo view.\n\n', '');
  const { notes } = releaseChangelog(empty, '0.2.2', '2026-11-02', ['fix(parse): tables without pipes', 'docs: typo']);
  assert.equal(notes, '### Fixed\n- tables without pipes');
});

test('plan and apply work on a real repository', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'odd-board-release-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const run = (...args) => execFileSync('node', [script, ...args], { cwd: dir, encoding: 'utf8' });

  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', version: '0.2.1' }, null, 2) + '\n');
  writeFileSync(join(dir, 'CHANGELOG.md'), CHANGELOG);
  writeFileSync(join(dir, 'docs', 'next-steps.md'), 'Current version: **0.2.1**. More.\n');
  git('add', '.');
  git('commit', '-q', '-m', 'chore: initial');
  git('tag', 'v0.2.1');

  git('commit', '-q', '--allow-empty', '-m', 'docs: only docs');
  assert.equal(run('plan'), '', 'docs alone do not release');

  git('commit', '-q', '--allow-empty', '-m', 'feat(board): multi-repo view');
  assert.equal(run('plan'), '0.3.0');

  run('apply', '0.3.0', 'notes.md');
  assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version, '0.3.0');
  assert.match(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), /## \[Unreleased\]\n\n## \[0\.3\.0\] - \d{4}-\d{2}-\d{2}\n\n### Added\n- Multi-repo view\./);
  assert.equal(readFileSync(join(dir, 'notes.md'), 'utf8'), '### Added\n- Multi-repo view.\n');
  assert.equal(readFileSync(join(dir, 'docs', 'next-steps.md'), 'utf8'), 'Current version: **0.3.0**. More.\n');
});
