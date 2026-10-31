import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, basename, sep } from 'node:path';
import { parseFeatureDoc } from './parse.js';
import { COLUMNS, columnFor, isBlocked } from './columns.js';
import { listWorktrees, worktreeActivity } from './git.js';

export const TASKS_DIR = join('odd', 'tasks');
export const DEFAULT_ACTIVE_WINDOW_MS = 10 * 60 * 1000;

async function isDir(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

// Reads odd/tasks/*.md from one checkout. Never throws for a single bad document.
export async function readFeatures(checkoutRoot) {
  const dir = join(checkoutRoot, TASKS_DIR);
  if (!(await isDir(dir))) return [];
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.md')).sort();
  const cards = [];
  for (const f of files) {
    const path = join(dir, f);
    let mtime = 0;
    try {
      mtime = (await stat(path)).mtimeMs;
      const md = await readFile(path, 'utf8');
      const card = parseFeatureDoc(md, relative(checkoutRoot, path));
      card.column = columnFor(card);
      card.blocked = isBlocked(card);
      card.updatedAt = mtime;
      cards.push(card);
    } catch (err) {
      cards.push({
        feature: f.replace(/\.md$/i, ''),
        file: relative(checkoutRoot, path),
        title: f,
        parsed: false,
        error: String(err.message || err),
        column: 'tracked',
        blocked: false,
        progress: { done: 0, total: 0 },
        tasks: [],
        updatedAt: mtime,
      });
    }
  }
  return cards;
}

const norm = (s) => (s || '').toLowerCase();

// A worktree belongs to a feature when its branch names the feature
// (feat/csv-export, feat/csv-export-agent-2, …) or when the newest copy of the
// feature document lives in it.
function featureForWorktree(wt, features) {
  const branch = norm(wt.branch);
  if (branch) {
    const matches = features.filter((f) => branch.includes(norm(f.feature)));
    if (matches.length) {
      // Prefer the longest slug so "export" does not steal "csv-export".
      const best = matches.sort((a, b) => b.feature.length - a.feature.length)[0];
      const tail = branch.split('/').pop();
      return { feature: best, role: tail === norm(best.feature) ? 'primary' : 'subagent' };
    }
  }
  const owned = features.find((f) => f.sourcePath === wt.path && !wt.main);
  return owned ? { feature: owned, role: 'primary' } : null;
}

function currentTask(card) {
  if (!card || !card.tasks) return null;
  const t = card.tasks.find((x) => x.current) || card.tasks.find((x) => !x.done);
  return t ? `${t.id}. ${t.text}` : null;
}

export async function buildBoard(repoRoot, { activeWindowMs = DEFAULT_ACTIVE_WINDOW_MS, now = Date.now() } = {}) {
  const worktrees = await listWorktrees(repoRoot);
  const mainPath = worktrees[0]?.dir || repoRoot;

  // 1. Read every checkout and pick one copy per feature document:
  //    the copy on the feature's own branch, else the main checkout, else the newest.
  //    (A worktree created later holds an older copy with a newer mtime, so mtime alone lies.)
  const copies = new Map();
  for (const wt of worktrees) {
    for (const card of await readFeatures(wt.dir)) {
      card.sourcePath = wt.path;
      card.sourceBranch = wt.branch;
      card.sourceMain = wt.main;
      if (!copies.has(card.feature)) copies.set(card.feature, []);
      copies.get(card.feature).push(card);
    }
  }
  const byFeature = new Map();
  for (const [feature, list] of copies) {
    const slug = norm(feature);
    const onBranch = list.filter((c) => norm(c.sourceBranch).split('/').pop() === slug);
    const pick =
      onBranch.sort((a, b) => b.updatedAt - a.updatedAt)[0] ||
      list.find((c) => c.sourceMain) ||
      list.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    byFeature.set(feature, pick);
  }
  const features = [...byFeature.values()].sort((a, b) => a.feature.localeCompare(b.feature));

  // 2. Activity per worktree, and which feature each one is working on.
  const lanes = [];
  for (const wt of worktrees) {
    const activity = await worktreeActivity(wt.path, { now });
    let link = featureForWorktree(wt, features);
    if (!link) {
      // Nested worktree (e.g. a subagent checkout inside a feature worktree).
      const parent = lanes.find((l) => l.feature && wt.path.startsWith(l.path + sep));
      if (parent) link = { feature: byFeature.get(parent.feature), role: 'subagent' };
    }
    const active = Boolean(activity.lastChange && now - activity.lastChange < activeWindowMs && (activity.changedFiles > 0 || !wt.main));
    lanes.push({
      path: wt.path,
      name: basename(wt.path),
      branch: wt.branch,
      main: wt.main,
      feature: link ? link.feature.feature : null,
      featureTitle: link ? link.feature.title : null,
      role: link ? link.role : null,
      currentTask: link ? currentTask(link.feature) : null,
      active,
      changedFiles: activity.changedFiles,
      lastChange: activity.lastChange,
    });
  }

  // 3. Attach workers to cards.
  for (const card of features) {
    card.workers = lanes
      .filter((l) => l.feature === card.feature)
      .map(({ name, branch, role, active, changedFiles, lastChange }) => ({ name, branch, role, active, changedFiles, lastChange }))
      .sort((a, b) => (a.role === 'primary' ? -1 : 1) - (b.role === 'primary' ? -1 : 1));
    card.activeWorkers = card.workers.filter((w) => w.active).length;
  }

  // Lanes worth showing: anything linked to a feature or currently active.
  const visibleLanes = lanes
    .filter((l) => l.feature || (l.active && !l.main))
    .sort((a, b) => Number(b.active) - Number(a.active) || (b.lastChange || 0) - (a.lastChange || 0));

  return {
    repo: basename(mainPath),
    generatedAt: new Date(now).toISOString(),
    activeWindowMs,
    columns: COLUMNS.map((c) => ({ ...c, cards: features.filter((card) => card.column === c.id) })),
    lanes: visibleLanes,
    totals: {
      features: features.length,
      blocked: features.filter((c) => c.blocked).length,
      tasksDone: features.reduce((n, c) => n + c.progress.done, 0),
      tasksTotal: features.reduce((n, c) => n + c.progress.total, 0),
      activeAgents: visibleLanes.filter((l) => l.active).length,
      activeFeatures: features.filter((c) => c.activeWorkers > 0).length,
      worktrees: worktrees.length,
    },
  };
}
