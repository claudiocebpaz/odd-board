import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, utimesSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildBoard } from '../src/board.js';
import { createDemoRepo, removeDemoRepo } from '../src/demo.js';

const find = (board, feature) => board.columns.flatMap((c) => c.cards).find((c) => c.feature === feature);

test('links worktrees to features and counts active agents', async (t) => {
  const demo = createDemoRepo();
  t.after(() => removeDemoRepo(demo));
  const board = await buildBoard(demo.main);

  assert.equal(board.totals.worktrees, 5);
  assert.equal(board.totals.activeAgents, 3);
  assert.equal(board.totals.activeFeatures, 2);

  const csv = find(board, 'csv-export');
  assert.equal(csv.activeWorkers, 2);
  assert.deepEqual(csv.workers.map((w) => [w.branch, w.role]), [
    ['feat/csv-export', 'primary'],
    ['feat/csv-export-agent-2', 'subagent'],
  ]);

  const billing = find(board, 'billing-sync');
  assert.equal(billing.workers.length, 1);
  assert.equal(billing.activeWorkers, 0);

  assert.equal(find(board, 'auth-sso').workers.length, 0);
});

test('reads the feature document from its own branch, not a stale newer copy', async (t) => {
  const demo = createDemoRepo();
  t.after(() => removeDemoRepo(demo));
  const csvWt = demo.worktrees.find((w) => w.name === 'csv-export').path;
  const doc = join(csvWt, 'odd', 'tasks', 'csv-export.md');
  writeFileSync(doc, readFileSync(doc, 'utf8').replace('- [ ] T4', '- [x] T4'));
  // Make another worktree's (older) copy look newer on disk.
  const other = join(demo.worktrees.find((w) => w.name === 'billing-sync').path, 'odd', 'tasks', 'csv-export.md');
  const future = new Date(Date.now() + 60_000);
  utimesSync(other, future, future);

  const board = await buildBoard(demo.main);
  assert.deepEqual(find(board, 'csv-export').progress, { done: 4, total: 6 });
});

test('worktrees go idle after the activity window', async (t) => {
  const demo = createDemoRepo();
  t.after(() => removeDemoRepo(demo));
  const board = await buildBoard(demo.main, { now: Date.now() + 60 * 60 * 1000 });
  assert.equal(board.totals.activeAgents, 0);
});

const examples = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples', 'demo-repo');

test('a subfolder of a git repo reads its own odd/tasks', async () => {
  const board = await buildBoard(examples);
  assert.equal(board.totals.features, 5);
});

test('a plain folder without git still works', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'odd-board-nogit-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(join(examples, 'odd'), join(dir, 'odd'), { recursive: true });
  const board = await buildBoard(dir);
  assert.equal(board.totals.features, 5);
  assert.equal(board.totals.worktrees, 1);
  assert.equal(board.totals.activeAgents, 0);
});

test('git is available for the demo', () => {
  assert.ok(execFileSync('git', ['--version']).toString().startsWith('git version'));
});
