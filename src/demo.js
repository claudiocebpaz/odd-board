// Builds a throwaway git repository with several worktrees and, optionally,
// simulates agents working in parallel so the board has something to show.

import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples', 'demo-repo');
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

function git(cwd, args, env = {}) {
  return execFileSync('git', ['-c', 'user.name=odd-board demo', '-c', 'user.email=demo@odd-board.local', ...args], {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString();
}

const WORKTREES = [
  { name: 'csv-export', branch: 'feat/csv-export', active: true },
  { name: 'csv-export-agent-2', branch: 'feat/csv-export-agent-2', active: true, finishesAfter: 6 },
  { name: 'rate-limit', branch: 'feat/rate-limit', active: true },
  { name: 'billing-sync', branch: 'feat/billing-sync', active: false },
];

export function createDemoRepo() {
  const base = mkdtempSync(join(tmpdir(), 'odd-board-demo-'));
  const main = join(base, 'demo-repo');
  mkdirSync(join(main, 'src'), { recursive: true });
  cpSync(join(EXAMPLES, 'odd'), join(main, 'odd'), { recursive: true });
  writeFileSync(join(main, 'src', 'app.py'), '# demo app\n');
  writeFileSync(join(main, 'README.md'), '# demo repo for odd-board\n');

  const old = { GIT_AUTHOR_DATE: TWO_HOURS_AGO, GIT_COMMITTER_DATE: TWO_HOURS_AGO };
  git(main, ['init', '-q', '-b', 'main']);
  git(main, ['add', '-A']);
  git(main, ['commit', '-q', '-m', 'initial'], old);

  for (const wt of WORKTREES) {
    wt.path = join(base, 'worktrees', wt.name);
    git(main, ['worktree', 'add', '-q', '-b', wt.branch, wt.path]);
    if (wt.active) appendFileSync(join(wt.path, 'src', 'app.py'), `# ${wt.name}: work in progress\n`);
  }
  return { base, main, worktrees: WORKTREES };
}

function checkNextTask(docPath) {
  const md = readFileSync(docPath, 'utf8');
  if (!/- \[ \]/.test(md)) return false;
  writeFileSync(docPath, md.replace('- [ ]', '- [x]'));
  return true;
}

// Every tick, active agents touch files; every few ticks the main csv-export
// agent checks off a task and commits; the second agent finishes and goes idle.
export function simulate(demo, { intervalMs = 3000 } = {}) {
  let tick = 0;
  const timer = setInterval(() => {
    tick++;
    for (const wt of demo.worktrees) {
      if (!wt.active) continue;
      if (wt.finishesAfter && tick >= wt.finishesAfter) {
        if (!wt.done) {
          git(wt.path, ['add', '-A']);
          git(wt.path, ['commit', '-q', '-m', `${wt.name}: done`], {
            GIT_AUTHOR_DATE: TWO_HOURS_AGO,
            GIT_COMMITTER_DATE: TWO_HOURS_AGO,
          });
          wt.done = true;
        }
        continue;
      }
      appendFileSync(join(wt.path, 'src', 'app.py'), `# ${wt.name}: tick ${tick}\n`);
    }
    const csv = demo.worktrees.find((w) => w.name === 'csv-export');
    if (tick % 4 === 0) checkNextTask(join(csv.path, 'odd', 'tasks', 'csv-export.md'));
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

export function removeDemoRepo(demo) {
  rmSync(demo.base, { recursive: true, force: true });
}
