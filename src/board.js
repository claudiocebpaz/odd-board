import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { parseFeatureDoc } from './parse.js';
import { COLUMNS, columnFor, isBlocked } from './columns.js';

export const TASKS_DIR = join('odd', 'tasks');

async function isDir(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export async function readFeatures(repoRoot) {
  const dir = join(repoRoot, TASKS_DIR);
  if (!(await isDir(dir))) return [];
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.md')).sort();
  const cards = [];
  for (const f of files) {
    const path = join(dir, f);
    try {
      const md = await readFile(path, 'utf8');
      const card = parseFeatureDoc(md, relative(repoRoot, path));
      card.column = columnFor(card);
      card.blocked = isBlocked(card);
      cards.push(card);
    } catch (err) {
      // Never break the board because of one document.
      cards.push({
        feature: f.replace(/\.md$/i, ''),
        file: relative(repoRoot, path),
        title: f,
        parsed: false,
        error: String(err.message || err),
        column: 'tracked',
        blocked: false,
        progress: { done: 0, total: 0 },
        tasks: [],
      });
    }
  }
  return cards;
}

export async function buildBoard(repoRoot) {
  const cards = await readFeatures(repoRoot);
  return {
    repo: basename(repoRoot),
    generatedAt: new Date().toISOString(),
    columns: COLUMNS.map((c) => ({ ...c, cards: cards.filter((card) => card.column === c.id) })),
    totals: {
      features: cards.length,
      blocked: cards.filter((c) => c.blocked).length,
      tasksDone: cards.reduce((n, c) => n + c.progress.done, 0),
      tasksTotal: cards.reduce((n, c) => n + c.progress.total, 0),
    },
  };
}
