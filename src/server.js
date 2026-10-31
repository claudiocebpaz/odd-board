import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoard } from './board.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Polls every worktree (documents + git activity) and pushes a new board over
// Server-Sent Events only when something actually changed.
export function startServer({ repoRoot, port = 4747, host = '127.0.0.1', intervalMs = 2000, activeWindowMs }) {
  const clients = new Set();
  let last = '';
  let latest = null;
  let busy = false;

  const fingerprint = (board) => JSON.stringify({ ...board, generatedAt: undefined });

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const board = await buildBoard(repoRoot, { activeWindowMs });
      const fp = fingerprint(board);
      latest = board;
      if (fp !== last) {
        last = fp;
        const payload = `data: ${JSON.stringify(board)}\n\n`;
        for (const res of clients) res.write(payload);
      }
    } catch (err) {
      console.error(`odd-board: ${err.message || err}`);
    } finally {
      busy = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);

  const current = async () => latest || buildBoard(repoRoot, { activeWindowMs });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/api/board') {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(await current()));
      }
      if (url.pathname === '/events') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        res.write(`data: ${JSON.stringify(await current())}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(await readFile(join(PUBLIC_DIR, 'index.html')));
      }
      res.writeHead(404).end('Not found');
    } catch (err) {
      res.writeHead(500).end(String(err.message || err));
    }
  });

  server.on('close', () => clearInterval(timer));

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}
