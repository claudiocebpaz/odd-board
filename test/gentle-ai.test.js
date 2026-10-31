// Real ODD feature documents from gentle-ai v4.3.1 (see test/fixtures/gentle-ai-v4.3.1/README.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeatureDoc } from '../src/parse.js';
import { columnFor } from '../src/columns.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'gentle-ai-v4.3.1');
const card = async (name) => parseFeatureDoc(await readFile(join(dir, `${name}.md`), 'utf8'), `odd/tasks/${name}.md`);

test('every gentle-ai fixture parses into a card with tasks', async () => {
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    const c = await card(file.replace(/\.md$/, ''));
    assert.equal(c.parsed, true, file);
    assert.ok(c.progress.total > 0, file);
  }
});

test('a task table reads the status and commit columns', async () => {
  const c = await card('4670-rdd-off-unc');
  assert.deepEqual(c.progress, { done: 1, total: 1 });
  assert.equal(c.tasks[0].id, 'T1');
  assert.equal(c.tasks[0].commit, 'dc79ccd');
  assert.equal(columnFor(c), 'closed');
});

test('the Status header picks the column, even after a route cell that says "later"', async () => {
  const c = await card('pi-routing-canon-bundle');
  assert.deepEqual(c.tasks.map((t) => [t.id, t.done]), [['T1', true], ['T2', false]]);
  assert.equal(c.tasks[0].text, 'gentle-ai: Pi clauses in `RenderRouting(AgentPi)`, bundle entry, semver, tests, docs');
  assert.equal(c.tasks[0].commit, '5aa0b88');
  assert.equal(c.tasks[1].current, true);
  assert.equal(columnFor(c), 'implementing');
});

test('a table without a work column labels the task with its evidence', async () => {
  const c = await card('beta-feedback-2026-10');
  assert.deepEqual(c.progress, { done: 9, total: 9 });
  assert.match(c.tasks[0].text, /^battery on b15198ba: 22 checks/);
  assert.equal(columnFor(c), 'closed');
});

test('`T1 | ... | done | commit: <sha>` items count, and dropped tasks do not', async () => {
  const c = await card('doctor-executable-health-delivery');
  assert.deepEqual(c.tasks.map((t) => t.id), ['T1', 'T2', 'T3', 'T4', 'T5']);
  assert.equal(c.tasks[3].dropped, true);
  assert.equal(c.tasks[3].done, false);
  assert.deepEqual(c.progress, { done: 4, total: 4 });
  assert.equal(c.tasks[0].commit, '6791e15');
  assert.equal(c.lastCommit, 'a576ed0');
  assert.equal(columnFor(c), 'closed');
});

test('`- T1 — ...; inline; done, commit <sha>` items read the status clause', async () => {
  const c = await card('4739-passive-delta-after-acknowledgement');
  assert.deepEqual(c.tasks.map((t) => [t.id, t.done, t.commit]), [['T1', true, '4189a2f'], ['T2', true, '2207879']]);
  assert.match(c.tasks[0].text, /^S2-S4: core helper/);
  assert.equal(columnFor(c), 'closed');
});

test('`1. [done] ...` numbered items are tasks', async () => {
  const c = await card('ga-2995-cr-edge-detachment');
  assert.deepEqual(c.progress, { done: 6, total: 6 });
  assert.deepEqual(c.tasks.map((t) => t.id), ['1', '2', '3', '4', '5', '6']);
  assert.equal(c.tasks[3].commit, '5971f43');
  assert.equal(columnFor(c), 'closed');
});

test('an open task marked BLOCKED flags the card', async () => {
  const c = await card('gentle-shell-linux-first-ci');
  assert.deepEqual(c.progress, { done: 7, total: 8 });
  const c6 = c.tasks.find((t) => t.id === 'C6');
  assert.equal(c6.blocked, true);
  assert.equal(c6.current, true);
  assert.equal(c.blocked, true);
  assert.equal(columnFor(c), 'implementing');
  assert.match(c.tasks.find((t) => t.id === 'C7').text, /^FORMAT FOLLOW-UP: /);
});

test('a planned feature with only open checkboxes is tracked and not blocked', async () => {
  const c = await card('gentle-shell-dual-mode-install');
  assert.deepEqual(c.progress, { done: 0, total: 7 });
  assert.equal(c.blocked, false);
  assert.equal(columnFor(c), 'tracked');
});

test('a top-level "Progress:" line counts as progress', async () => {
  const c = await card('claude-native-rdd-models');
  assert.deepEqual(c.progress, { done: 2, total: 2 });
  assert.equal(c.pendingChecks, true);
  assert.equal(columnFor(c), 'verifying');
});

test('TDD RED evidence is not a pending check', async () => {
  const c = await card('pi-sync-mcp-json');
  assert.deepEqual(c.progress, { done: 2, total: 2 });
  assert.equal(c.pendingChecks, false);
  assert.equal(columnFor(c), 'closed');
});

test('failures the document calls pre-existing and unrelated are not pending checks', async () => {
  const c = await card('telemetry-metrics-cardinality');
  assert.deepEqual(c.progress, { done: 4, total: 4 });
  assert.equal(c.pendingChecks, false);
  assert.equal(columnFor(c), 'closed');
  assert.match(c.nextStep, /^Push, deploy, and a baseline measurement/);
});

test('review lineage IDs and sha256 digests are not commits', () => {
  const md = [
    '# ga-4882',
    '## Tasks',
    '1. [done] Native review lineage review-d61a45dd63798350 (medium, 1 lens): approved + acknowledged/burned.',
    '2. [done] Frozen target sha256:d55cf72a78205e67 acknowledged.',
    '3. [done] Commit 7ce9baa7 + push; PR #4914 opened.',
  ].join('\n');
  const c = parseFeatureDoc(md, 'ga-4882.md');
  assert.deepEqual(c.tasks.map((t) => t.commit), [null, null, '7ce9baa']);
});

test('status cells and clauses in Spanish', () => {
  const md = [
    '# Exportar CSV',
    '## Tareas',
    '| ID | Specs | Ruta | Estado | Commit |',
    '|---|---|---|---|---|',
    '| T1 | S1 | inline | hecho | 4e19ab2c |',
    '| T2 | S2 | delegado | bloqueado: falta la clave de la API | |',
    '- T3 — S3: botón de descarga; inline; pendiente',
  ].join('\n');
  const c = parseFeatureDoc(md, 'exportar.md');
  assert.deepEqual(c.tasks.map((t) => [t.id, t.done]), [['T1', true], ['T2', false], ['T3', false]]);
  assert.equal(c.tasks[0].commit, '4e19ab2');
  assert.equal(c.blocked, true);
});
