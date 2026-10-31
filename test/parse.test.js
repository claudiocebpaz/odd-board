import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeatureDoc, parseFrontmatter } from '../src/parse.js';
import { columnFor } from '../src/columns.js';
import { buildBoard } from '../src/board.js';

const here = dirname(fileURLToPath(import.meta.url));
const demo = join(here, '..', 'examples', 'demo-repo');
const doc = (name) => readFile(join(demo, 'odd', 'tasks', `${name}.md`), 'utf8');

test('counts tasks from checkboxes and extracts commits', async () => {
  const card = parseFeatureDoc(await doc('csv-export'), 'odd/tasks/csv-export.md');
  assert.equal(card.feature, 'csv-export');
  assert.equal(card.title, 'CSV export for reports');
  assert.deepEqual(card.progress, { done: 3, total: 6 });
  assert.equal(card.tasks[0].id, 'T1');
  assert.equal(card.tasks[0].commit, 'a1f3c9e');
  assert.equal(card.lastCommit, 'c88d01f');
  assert.equal(card.tasks[3].current, true);
  assert.equal(card.nextStep, 'Make the date filter test pass for T4.');
});

test('derives one column per ODD stage', async () => {
  const col = async (name) => columnFor(parseFeatureDoc(await doc(name), `${name}.md`));
  assert.equal(await col('auth-sso'), 'tracked');
  assert.equal(await col('csv-export'), 'implementing');
  assert.equal(await col('billing-sync'), 'implementing');
  assert.equal(await col('rate-limit'), 'verifying');
  assert.equal(await col('healthcheck'), 'closed');
});

test('flags blocked work without moving it to another column', async () => {
  const card = parseFeatureDoc(await doc('billing-sync'), 'billing-sync.md');
  assert.equal(card.blocked, true);
  assert.equal(columnFor(card), 'implementing');
});

test('all tasks done but checks pending stays in verifying', () => {
  const md = '# X\n\n## Tasks\n- [x] T1: a\n- [x] T2: b\n\n## Progress\nReview pending.\n';
  assert.equal(columnFor(parseFeatureDoc(md, 'x.md')), 'verifying');
});

test('explicit frontmatter status wins over derivation', () => {
  const md = '---\nstatus: closed\n---\n# Y\n- [ ] T1: open\n';
  const card = parseFeatureDoc(md, 'y.md');
  assert.equal(card.frontmatterStatus, 'closed');
  assert.equal(columnFor(card), 'closed');
});

test('tolerates free-form documents in Spanish', () => {
  const md = '# Exportar\n\n## Tareas\n- [x] Endpoint\n- [ ] Botón\n\n## Próximo paso\nBloqueado: requiere tu decisión.\n';
  const card = parseFeatureDoc(md, 'exportar.md');
  assert.deepEqual(card.progress, { done: 1, total: 2 });
  assert.equal(card.blocked, true);
  assert.equal(card.nextStep, 'Bloqueado: requiere tu decisión.');
});

test('documents without tasks or sections are marked unparsed, not dropped', () => {
  const card = parseFeatureDoc('just some notes', 'notes.md');
  assert.equal(card.parsed, false);
  assert.equal(columnFor(card), 'tracked');
});

test('frontmatter parser handles quotes and missing frontmatter', () => {
  assert.deepEqual(parseFrontmatter('---\ntitle: "Hi"\n---\nbody').data, { title: 'Hi' });
  assert.deepEqual(parseFrontmatter('no frontmatter').data, {});
});

test('builds the full board for a repo', async () => {
  const board = await buildBoard(demo);
  assert.equal(board.totals.features, 5);
  assert.equal(board.totals.blocked, 1);
  assert.deepEqual(board.columns.map((c) => c.cards.length), [1, 2, 1, 1]);
});

test('missing odd/tasks yields an empty board', async () => {
  const board = await buildBoard(here);
  assert.equal(board.totals.features, 0);
});

test('strips trailing evidence references from task labels', () => {
  const card = parseFeatureDoc('# Z\n- [x] T1: Add endpoint — evidence a1f3c9e\n- [x] T2: Map (commit: 7b20e41)\n', 'z.md');
  assert.equal(card.tasks[0].text, 'Add endpoint');
  assert.equal(card.tasks[1].text, 'Map');
  assert.equal(card.tasks[1].commit, '7b20e41');
});
