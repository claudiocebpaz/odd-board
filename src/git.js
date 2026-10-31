// Git is the deterministic source for parallel work: which worktrees exist,
// which branch each one is on, and whether an agent is touching it right now.
// ODD itself records nothing about parallelism.

import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function git(cwd, args) {
  const { stdout } = await run('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

// Worktrees of the repository that contains repoRoot. If repoRoot is a
// subfolder (monorepo), `dir` points at the same subfolder inside each worktree.
export async function listWorktrees(repoRoot) {
  try {
    const prefix = (await git(repoRoot, ['rev-parse', '--show-prefix'])).trim();
    const out = await git(repoRoot, ['worktree', 'list', '--porcelain']);
    const worktrees = [];
    let current = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('worktree ')) {
        current = { path: resolve(line.slice(9)), branch: null, head: null, main: worktrees.length === 0 };
        worktrees.push(current);
      } else if (current && line.startsWith('branch ')) {
        current.branch = line.slice(7).replace(/^refs\/heads\//, '');
      } else if (current && line.startsWith('HEAD ')) {
        current.head = line.slice(5, 12);
      } else if (current && line === 'prunable') {
        current.prunable = true;
      }
    }
    return worktrees.filter((w) => !w.prunable).map((w) => ({ ...w, dir: resolve(w.path, prefix) }));
  } catch {
    // Not a git repository: a single "worktree" that is just the folder.
    return [{ path: resolve(repoRoot), dir: resolve(repoRoot), branch: null, head: null, main: true }];
  }
}

export async function worktreeActivity(path, { now = Date.now() } = {}) {
  let changedFiles = 0;
  let lastChange = 0;
  try {
    const status = await git(path, ['status', '--porcelain', '--untracked-files=all']);
    const files = status.split('\n').filter(Boolean).map((l) => l.slice(3).split(' -> ').pop());
    changedFiles = files.length;
    for (const f of files.slice(0, 200)) {
      try {
        lastChange = Math.max(lastChange, (await stat(join(path, f))).mtimeMs);
      } catch {
        // deleted file: no mtime
      }
    }
    const lastCommit = Number((await git(path, ['log', '-1', '--format=%ct'])).trim()) * 1000;
    if (lastCommit) lastChange = Math.max(lastChange, lastCommit);
  } catch {
    // not a git checkout or git missing
  }
  return { changedFiles, lastChange: lastChange || null, checkedAt: now };
}
