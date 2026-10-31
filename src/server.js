import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoard, TASKS_DIR } from './board.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function startServer({ repoRoot, port = 4747, host = '127.0.0.1' }) {
  const clients = new Set();
  let timer = null;

  const broadcast = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const payload = `data: ${JSON.stringify(await buildBoard(repoRoot))}\n\n`;
      for (const res of clients) res.write(payload);
    }, 150);
  };

  // Watch odd/tasks; if it does not exist yet, wait for it to appear.
  const tasksDir = join(repoRoot, TASKS_DIR);
  let watcher = null;
  const attach = () => {
    if (watcher || !existsSync(tasksDir)) return;
    watcher = watch(tasksDir, broadcast);
    watcher.on('error', () => {
      watcher = null;
    });
    broadcast();
  };
  attach();
  const poll = setInterval(attach, 2000);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/api/board') {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(await buildBoard(repoRoot)));
      }
      if (url.pathname === '/events') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        res.write(`data: ${JSON.stringify(await buildBoard(repoRoot))}\n\n`);
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

  server.on('close', () => {
    clearInterval(poll);
    watcher?.close();
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}
