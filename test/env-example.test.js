// .env.example must list every environment variable the CLI and library read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function readVars(dir) {
  const names = new Set();
  for (const file of (await readdir(join(root, dir))).filter((f) => f.endsWith('.js'))) {
    const src = await readFile(join(root, dir, file), 'utf8');
    for (const m of src.matchAll(/process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\])/g)) {
      names.add(m[1] ?? m[2]);
    }
  }
  return names;
}

test('every process.env variable read in bin/ and src/ is listed in .env.example', async () => {
  const example = await readFile(join(root, '.env.example'), 'utf8');
  const listed = new Set([...example.matchAll(/^#?\s*([A-Z_][A-Z0-9_]*)\s*=/gm)].map((m) => m[1]));
  const used = new Set([...(await readVars('bin')), ...(await readVars('src'))]);
  const missing = [...used].filter((name) => !listed.has(name));
  assert.deepEqual(missing, [], `add these to .env.example: ${missing.join(', ')}`);
});
