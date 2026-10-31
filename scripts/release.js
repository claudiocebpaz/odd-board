#!/usr/bin/env node
// Decides and prepares releases from Conventional Commits. Used by
// .github/workflows/release.yml on every push to main; never run by hand.
//
//   node scripts/release.js plan                 prints the next version, or nothing
//   node scripts/release.js apply <ver> <notes>  bumps package.json, CHANGELOG.md and
//                                                docs/next-steps.md, writes release notes
//
// Node standard library only, like the rest of the project.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HEADER = /^(\w+)(?:\([^)]*\))?(!)?:\s*(.+)$/;

// One commit message → its release weight: 'major', 'minor', 'patch' or null.
export function bumpOf(message) {
  const [subject, ...body] = message.trim().split('\n');
  const m = HEADER.exec(subject.trim());
  if (!m) return null;
  if (m[2] || body.some((line) => /^BREAKING[ -]CHANGE:/.test(line))) return 'major';
  if (m[1] === 'feat') return 'minor';
  if (m[1] === 'fix' || m[1] === 'perf') return 'patch';
  return null;
}

// Next version for a list of commit messages, or null when nothing is releasable.
// Before 1.0.0 a breaking change bumps the minor version, as SemVer allows.
export function nextVersion(current, messages) {
  const order = { patch: 1, minor: 2, major: 3 };
  let bump = null;
  for (const message of messages) {
    const b = bumpOf(message);
    if (b && (!bump || order[b] > order[bump])) bump = b;
  }
  if (!bump) return null;
  let [major, minor, patch] = current.split('-')[0].split('.').map(Number);
  if (bump === 'major' && major === 0) bump = 'minor';
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

// Entries for an empty Unreleased section, built from commit subjects.
function entriesFrom(messages) {
  const groups = { Added: [], Fixed: [] };
  for (const message of messages) {
    const m = HEADER.exec(message.trim().split('\n')[0].trim());
    if (!m) continue;
    if (m[1] === 'feat') groups.Added.push(m[3]);
    if (m[1] === 'fix' || m[1] === 'perf') groups.Fixed.push(m[3]);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([title, items]) => `### ${title}\n${items.map((i) => `- ${i}`).join('\n')}`)
    .join('\n\n');
}

// Moves the Unreleased entries under a new version heading and leaves an empty
// Unreleased section. Returns the new changelog and the release notes.
export function releaseChangelog(text, version, date, messages = []) {
  const heading = /^## \[Unreleased\][^\n]*\n/m;
  const match = heading.exec(text);
  if (!match) throw new Error('CHANGELOG.md has no "## [Unreleased]" section');
  const start = match.index + match[0].length;
  const next = text.slice(start).search(/^## \[/m);
  const end = next === -1 ? text.length : start + next;
  const notes = text.slice(start, end).trim() || entriesFrom(messages);
  const changelog =
    text.slice(0, match.index) +
    `## [Unreleased]\n\n## [${version}] - ${date}\n\n${notes}\n\n` +
    text.slice(end);
  return { changelog, notes };
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function messagesSinceLastTag() {
  let range = 'HEAD';
  try {
    range = `${git('describe', '--tags', '--abbrev=0', '--match', 'v*')}..HEAD`;
  } catch {
    // No tag yet: every commit counts.
  }
  const log = git('log', '--format=%B%x00', range);
  return log.split('\0').map((m) => m.trim()).filter(Boolean);
}

function main([command, version, notesPath]) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const messages = messagesSinceLastTag();
  if (command === 'plan') {
    const next = nextVersion(pkg.version, messages);
    if (next) process.stdout.write(next);
    return;
  }
  if (command === 'apply' && version && notesPath) {
    pkg.version = version;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    const date = new Date().toISOString().slice(0, 10);
    const { changelog, notes } = releaseChangelog(readFileSync('CHANGELOG.md', 'utf8'), version, date, messages);
    writeFileSync('CHANGELOG.md', changelog);
    writeFileSync(notesPath, notes + '\n');
    const steps = readFileSync('docs/next-steps.md', 'utf8');
    writeFileSync('docs/next-steps.md', steps.replace(/Current version: \*\*[^*]+\*\*/, `Current version: **${version}**`));
    return;
  }
  console.error('usage: release.js plan | apply <version> <notes-file>');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
