#!/usr/bin/env node
import { resolve, join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { startServer } from '../src/server.js';
import { buildBoard, TASKS_DIR } from '../src/board.js';

const HELP = `odd-board — live Kanban board for ODD feature documents

Usage
  npx odd-board [repo-path] [options]

Options
  -p, --port <n>   Port to listen on (default 4747)
  --host <host>    Host to bind (default 127.0.0.1)
  --json           Print the board as JSON and exit
  --demo           Serve the bundled example documents
  --open           Open the board in your browser
  -h, --help       Show this help
`;

const args = process.argv.slice(2);
const opts = { port: 4747, host: '127.0.0.1', json: false, demo: false, open: false, path: '.' };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') {
    process.stdout.write(HELP);
    process.exit(0);
  } else if (a === '-p' || a === '--port') opts.port = Number(args[++i]);
  else if (a === '--host') opts.host = args[++i];
  else if (a === '--json') opts.json = true;
  else if (a === '--demo') opts.demo = true;
  else if (a === '--open') opts.open = true;
  else if (a.startsWith('-')) {
    console.error(`Unknown option: ${a}\n\n${HELP}`);
    process.exit(1);
  } else opts.path = a;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = opts.demo ? resolve(here, '..', 'examples', 'demo-repo') : resolve(opts.path);

if (opts.json) {
  process.stdout.write(`${JSON.stringify(await buildBoard(repoRoot), null, 2)}\n`);
  process.exit(0);
}

if (!existsSync(join(repoRoot, TASKS_DIR))) {
  console.warn(`No ${TASKS_DIR}/ in ${repoRoot} yet — the board will fill in as ODD creates feature documents.`);
}

const server = await startServer({ repoRoot, port: opts.port, host: opts.host }).catch((err) => {
  console.error(`Could not start on ${opts.host}:${opts.port} — ${err.message}`);
  process.exit(1);
});

const url = `http://${opts.host}:${server.address().port}`;
console.log(`odd-board watching ${join(repoRoot, TASKS_DIR)}\n→ ${url}`);

if (opts.open) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref();
}
