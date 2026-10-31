#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { startServer } from '../src/server.js';
import { buildBoard, TASKS_DIR } from '../src/board.js';
import { createDemoRepo, simulate, removeDemoRepo } from '../src/demo.js';

const HELP = `odd-board — live Kanban board for ODD feature documents

Usage
  npx odd-board [repo-path] [options]

Options
  -p, --port <n>   Port to listen on (default 4747)
  --host <host>    Host to bind (default 127.0.0.1)
  --window <min>   Minutes since the last change for a worktree to count
                   as an active agent (default 10)
  --json           Print the board as JSON and exit
  --demo           Temporary repo with worktrees and simulated parallel agents
  --open           Open the board in your browser
  -h, --help       Show this help
`;

const args = process.argv.slice(2);
const opts = { port: 4747, host: '127.0.0.1', json: false, demo: false, open: false, path: '.', window: 10 };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') {
    process.stdout.write(HELP);
    process.exit(0);
  } else if (a === '-p' || a === '--port') opts.port = Number(args[++i]);
  else if (a === '--host') opts.host = args[++i];
  else if (a === '--window') opts.window = Number(args[++i]);
  else if (a === '--json') opts.json = true;
  else if (a === '--demo') opts.demo = true;
  else if (a === '--open') opts.open = true;
  else if (a.startsWith('-')) {
    console.error(`Unknown option: ${a}\n\n${HELP}`);
    process.exit(1);
  } else opts.path = a;
}

if (!Number.isFinite(opts.window) || opts.window <= 0) {
  console.error('--window must be a positive number of minutes');
  process.exit(1);
}
const activeWindowMs = opts.window * 60 * 1000;

let demo = null;
let stopSimulation = () => {};
if (opts.demo) {
  try {
    demo = createDemoRepo();
  } catch (err) {
    console.error(`--demo needs git installed: ${err.message}`);
    process.exit(1);
  }
  const cleanup = () => {
    stopSimulation();
    removeDemoRepo(demo);
  };
  process.on('exit', cleanup);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0));
}
const repoRoot = demo ? demo.main : resolve(opts.path);

if (opts.json) {
  process.stdout.write(`${JSON.stringify(await buildBoard(repoRoot, { activeWindowMs }), null, 2)}\n`);
  process.exit(0);
}

if (!existsSync(join(repoRoot, TASKS_DIR))) {
  console.warn(`No ${TASKS_DIR}/ in ${repoRoot} yet — the board will fill in as ODD creates feature documents.`);
}

if (demo) stopSimulation = simulate(demo);

const server = await startServer({ repoRoot, port: opts.port, host: opts.host, activeWindowMs }).catch((err) => {
  console.error(`Could not start on ${opts.host}:${opts.port} — ${err.message}`);
  process.exit(1);
});

const url = `http://${opts.host}:${server.address().port}`;
console.log(`odd-board watching ${join(repoRoot, TASKS_DIR)} and its git worktrees${demo ? ' (demo with simulated agents)' : ''}\n→ ${url}`);

if (opts.open) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref();
}
