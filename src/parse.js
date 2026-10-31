// Parses an ODD feature document (odd/tasks/<feature>.md) into a board card.
//
// ODD does not define a fixed schema or a status field for feature documents.
// What it does guarantee: sections (objective, scope, tasks, evidence, progress,
// next step) and checkboxes that are only checked with observed proof.
// So this parser is deliberately tolerant: counts come from checkboxes
// (deterministic), and everything else is best-effort.

const CHECKBOX = /^([ \t]*)[-*]\s+\[( |x|X)\]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const FENCE = /^\s*(```|~~~)/;

// Real gentle-ai documents (v4.3.1) record task state in more ways than a
// checkbox: a status column in a table, a `T1 | ... | done | ...` list item,
// `1. [done] ...`, or `- T1 — ...; inline; done, commit abc1234`. These are
// only read inside a tasks section, where a leading ID marks a task.
const TASK_ID = String.raw`[A-Z]{1,5}(?:-[A-Z]{1,3})?-?\d+[a-z]?(?:[.-][A-Za-z0-9]+)*`;
const ID_PREFIX = new RegExp(String.raw`^\*{0,2}(${TASK_ID})\*{0,2}(?:[:.)\s|—–-]|$)\s*`);
const LIST_ITEM = /^([ \t]*)(?:[-*+]|\d+[.)])\s+(.*)$/;
const BRACKET_STATUS = /^([ \t]*)(?:[-*+]|(\d+)[.)])\s+\[([^\]]{2,})\]\s+(.*)$/;
const INLINE_NEXT = /^\s*(?:[-*+]\s+)?\**(?:next(?:\s*step)?|pr[oó]ximo\s*paso|siguiente\s*paso)\**\s*:\**\s*(.*)$/i;
// A top-level "Progress: ..." line outside a progress section (sub-items of a
// task, like "  - Status: done", are not the feature's progress).
const INLINE_PROGRESS = /^(?:[-*+]\s+)?\**(?:progress|progreso|avance|status|estado)\**\s*:\**\s*(\S.*)$/i;
const TASKS_HEADING = [/\btasks?\b/i, /\btareas?\b/i, /\bwork units?\b/i];

const STATUS_DONE = /^(done|complete[ds]?|closed|verified|merged|landed|committed|fixed|shipped|delivered|hech[oa]|completad[oa]|terminad[oa]|cerrad[oa]|list[oa])\b/i;
const STATUS_DROPPED = /^(dropped|superseded|cancell?ed|abandoned|obsolete|won'?t do|descartad[oa]|cancelad[oa])\b/i;
const STATUS_OPEN = /^(pending|todo|to do|open|in progress|wip|later|deferred|not started|partial|pendiente|en progreso|en curso)\b/i;
const STATUS_BLOCKED = /^(blocked|bloquead[oa])\b/i;

// The status written in a cell or clause, if it starts with one. A leading
// sub-task ID ("T6a committed 5b8ec36") is skipped.
function statusOf(text) {
  const t = text.replace(/^[\s*_`[(]+/, '').replace(new RegExp(`^${TASK_ID}\\s+`), '');
  if (STATUS_DONE.test(t)) return 'done';
  if (STATUS_DROPPED.test(t)) return 'dropped';
  if (STATUS_BLOCKED.test(t)) return 'blocked';
  if (STATUS_OPEN.test(t)) return 'open';
  return null;
}

const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

// A commit reference next to "evidence"/"commit" or in backticks can be any
// hex string. A bare one must mix letters and digits, so numbers like
// "10000000 rows" or words like "defaced" are not taken for commits.
const COMMIT_IN_CONTEXT = [
  /\b(?:evidence|evidencia|commit)\b\s*:?\s*`?([0-9a-f]{7,40})\b/i,
  /`([0-9a-f]{7,40})`/,
];
// Hex IDs glued to a prefix ("review-562ea3fd", "sha256:d55c") are not commits.
const COMMIT_BARE = /(?<![-:/#.@])\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)([0-9a-f]{7,40})\b/;

const SECTION_ALIASES = {
  progress: [/progress/i, /progreso/i, /avance/i, /status/i, /estado/i],
  nextStep: [/next\s*step/i, /pr[oó]ximo\s*paso/i, /siguiente\s*paso/i, /\bnext\b(?!\.\w)/i],
  evidence: [/evidence/i, /evidencia/i, /verification/i, /verificaci[oó]n/i],
  objective: [/objective/i, /objetivo/i, /goal/i],
};

const BLOCKED_HINTS = [
  /\bblocked\b/i,
  /\bbloquead[oa]\b/i,
  /needs? (your|a|user) decision/i,
  /requiere (tu|una) decisi[oó]n/i,
  /waiting (for|on)\b/i,
  /esperando\b/i,
];

// Phrases removed before looking for blocked hints: negations, and waiting
// on automated checks (that is a pending check, not a blocker).
const NOT_BLOCKED = [
  /\b(no longer|not|never|was|were|previously)\s+blocked\b/gi,
  /\b(ya no|no|sin estar)\s+(est[aá]\s+)?bloquead[oa]\b/gi,
  /\bwaiting (for|on) (the )?(ci|build|tests?|pipeline|checks?)\b/gi,
  /\besperando (el |la |los )?(ci|build|tests?|pipeline)\b/gi,
  // "a blocked request", "dependency-blocked tests": something else was blocked.
  /\b(a|an)\s+blocked\b/gi,
  /\w-blocked\b/gi,
];

const PENDING_CHECK_HINTS = [
  /\bfail(ed|ing)?\b/i,
  /\bfall[oó]\b/i,
  /\bpending (check|verification|review)/i,
  /\bverificaci[oó]n pendiente\b/i,
  /\bchequeo pendiente\b/i,
  /\breview pending\b/i,
];

// Test summaries that report zero failures ("42 passed, 0 failed").
const NO_FAILURES = [
  /\b(0|zero|no|none)\s+(tests?\s+)?(failed|failing|failures?)\b/gi,
  /\bfail(ed|ures?|ing)?\s*[:=]\s*0\b/gi,
  /^\s*fail(ed|ures?)?\s+0\s*$/gim,
  /\b(0|ning[uú]n|ninguno|sin)\s+(tests?\s+)?(fall(os|aron|ados|idos)|fall[oó])\b/gi,
];

// Lines that mention a failure without leaving a check pending: the RED step
// of test-first work (ODD records it as evidence), and failures the document
// itself calls pre-existing, unrelated or flaky.
const NOT_PENDING_LINES = [/\bRED\b/, /\b(pre-?existing|unrelated|flak(e|y|iness))\b/i];

const without = (text, patterns) => patterns.reduce((t, p) => t.replace(p, ' '), text);
const withoutLines = (text, patterns) => text.split('\n').filter((l) => !patterns.some((p) => p.test(l))).join('\n');

function findCommit(text) {
  for (const p of COMMIT_IN_CONTEXT) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return text.match(COMMIT_BARE)?.[1] || null;
}

const indentOf = (ws) => ws.replace(/\t/g, '    ').length;

export function parseFrontmatter(md) {
  if (!md.startsWith('---')) return { data: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: md };
  const raw = md.slice(3, end).trim();
  const data = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) data[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
  }
  const body = md.slice(end + 4).replace(/^\r?\n/, '');
  return { data, body };
}

function sectionKey(title) {
  for (const [key, patterns] of Object.entries(SECTION_ALIASES)) {
    if (patterns.some((p) => p.test(title))) return key;
  }
  return null;
}

function firstMeaningfulLine(lines) {
  let fenced = false;
  for (const line of lines) {
    if (FENCE.test(line)) fenced = !fenced;
    if (fenced || FENCE.test(line)) continue;
    const t = line.replace(/^\s*[-*>]\s*/, '').trim();
    if (t && !CHECKBOX.test(line)) return t;
  }
  return null;
}

export function parseFeatureDoc(md, file = 'feature.md') {
  const { data: frontmatter, body } = parseFrontmatter(md.replace(/\r\n/g, '\n'));
  const lines = body.split('\n');

  const feature = file.split('/').pop().replace(/\.md$/i, '');
  let title = frontmatter.title || null;
  const sections = {};
  const tasks = [];
  let current = null;
  let fenced = false;
  // Indentation of the last task. A deeper item right below it is a sub-item
  // (acceptance criteria, evidence), not a task of its own.
  let taskIndent = null;
  // Heading level of the tasks section we are in, and the columns of the
  // task table under it, if any.
  let tasksLevel = null;
  let columns = null;
  // `Next: ...` lines outside a next step section; the last one wins.
  let inlineNext = null;
  let awaitingNext = false;
  const inlineProgress = [];

  const addTask = (indent, text, status, fallbackId, commitText = text) => {
    if (taskIndent !== null && indent > taskIndent) return;
    taskIndent = indent;
    const idMatch = text.match(ID_PREFIX);
    const commit = findCommit(commitText);
    const label = (idMatch ? text.slice(idMatch[0].length) : text)
      .replace(/\s*[—–-]*\s*\(?\s*(evidence|evidencia|commit)\s*:?\s*`?[0-9a-f]{7,40}`?\s*\)?\s*\.?\s*$/i, '')
      .replace(/\*\*/g, '')
      .replace(/^[\s*—–:|-]+/, '')
      .trim();
    const task = {
      id: idMatch ? idMatch[1] : fallbackId || `${tasks.length + 1}`,
      text: label,
      done: status === 'done',
      commit: commit ? commit.slice(0, 7) : null,
    };
    if (status === 'dropped') task.dropped = true;
    // An open task can say it is blocked: a status cell, or "**BLOCKED**: ...".
    if (status === 'blocked' || (status === 'open' && statusOf(label) === 'blocked')) task.blocked = true;
    tasks.push(task);
  };

  // A table row or `T1 | ... | done` item: the ID cell, the status cell (by
  // header, else the first cell that starts with a status) and the commit. The
  // label is the work column, else the longest other cell.
  const addRowTask = (indent, cells) => {
    const statusCol = columns?.status ?? cells.findIndex((c, i) => i > 0 && statusOf(c));
    const status = statusOf(cells[statusCol] || '');
    if (!status) return false;
    const commitCell = columns?.commit !== undefined ? cells[columns.commit] : '';
    const rest = cells.filter((_, i) => i > 0 && i !== statusCol);
    const text = cells[columns?.work] ?? rest.reduce((a, b) => (b.length > a.length ? b : a), '');
    addTask(indent, `${cells[0]} ${text}`, status, null, `${commitCell} ${cells[statusCol]} ${rest.join(' ')}`);
    return true;
  };

  for (const line of lines) {
    // Code blocks keep their wording for the section, but their headings and
    // checkboxes are examples, not structure.
    if (FENCE.test(line)) fenced = !fenced;
    if (fenced || FENCE.test(line)) {
      if (current) sections[current].push(line);
      continue;
    }

    const h = line.match(HEADING);
    if (h) {
      const level = h[1].length;
      if (!title && level === 1) title = h[2];
      current = sectionKey(h[2]);
      if (current && !sections[current]) sections[current] = [];
      if (tasksLevel === null || level <= tasksLevel) {
        tasksLevel = TASKS_HEADING.some((p) => p.test(h[2])) ? level : null;
      }
      taskIndent = null;
      columns = null;
      awaitingNext = false;
      continue;
    }
    if (current) sections[current].push(line);

    if (current !== 'nextStep') {
      const n = line.match(INLINE_NEXT);
      if (n) {
        inlineNext = n[1].trim() || null;
        awaitingNext = !inlineNext;
      } else if (awaitingNext && line.trim()) {
        inlineNext = firstMeaningfulLine([line]);
        awaitingNext = false;
      }
    }

    if (current !== 'progress') {
      const p = line.match(INLINE_PROGRESS);
      if (p) inlineProgress.push(p[1]);
    }

    const c = line.match(CHECKBOX);
    if (c) {
      addTask(indentOf(c[1]), c[3].trim(), c[2].toLowerCase() === 'x' ? 'done' : 'open');
      continue;
    }
    if (tasksLevel === null) continue;

    if (/^\s*\|/.test(line)) {
      const cells = splitRow(line);
      if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
      if (!ID_PREFIX.test(cells[0])) {
        const status = cells.findIndex((cell) => /^(status|estado|state)$/i.test(cell));
        const commit = cells.findIndex((cell) => /^(commits?|evidence|evidencia)$/i.test(cell));
        const work = cells.findIndex((cell) => /^(work|tasks?|tareas?|description|descripci[oó]n|what|title)$/i.test(cell));
        if (status > 0) columns = { status, ...(commit > 0 ? { commit } : {}), ...(work > 0 ? { work } : {}) };
        continue;
      }
      addRowTask(0, cells);
      continue;
    }

    const b = line.match(BRACKET_STATUS);
    const bracketStatus = b && statusOf(b[3]);
    if (bracketStatus) {
      addTask(indentOf(b[1]), b[4].trim(), bracketStatus, b[2]);
      continue;
    }

    const item = line.match(LIST_ITEM);
    if (!item || !ID_PREFIX.test(item[2])) continue;
    const indent = indentOf(item[1]);
    if (item[2].includes('|') && addRowTask(indent, splitRow(item[2]))) continue;
    // `- T1 — what; route; done, commit abc1234`: a clause that starts with a status.
    const clauses = item[2].split(/;\s+/);
    const at = clauses.findIndex((cl, i) => i > 0 && statusOf(cl));
    if (at > 0) addTask(indent, clauses.slice(0, at).join('; '), statusOf(clauses[at]), null, item[2]);
  }

  const progressText = [...(sections.progress || []), ...inlineProgress].join('\n');
  const nextStepText = (sections.nextStep || []).join('\n');
  const evidenceText = (sections.evidence || []).join('\n');
  const statusText = `${progressText}\n${nextStepText}`;

  // Dropped tasks stay on the card but count neither as done nor as remaining.
  const counted = tasks.filter((t) => !t.dropped);
  const done = counted.filter((t) => t.done).length;
  const nextStep = firstMeaningfulLine(sections.nextStep || []) || inlineNext;

  // The first open task is the one in progress (ODD implements task by task).
  const firstOpen = counted.find((t) => !t.done);
  if (firstOpen && done > 0) firstOpen.current = true;

  return {
    feature,
    file,
    title: title || feature,
    summary: frontmatter.summary || firstMeaningfulLine(sections.objective || []),
    frontmatterStatus: frontmatter.status || null,
    issue: frontmatter.issue || null,
    tasks,
    progress: { done, total: counted.length },
    nextStep,
    blocked:
      counted.some((t) => t.blocked && !t.done) ||
      BLOCKED_HINTS.some((p) => p.test(without(statusText, NOT_BLOCKED))),
    pendingChecks: PENDING_CHECK_HINTS.some((p) =>
      p.test(without(withoutLines(`${statusText}\n${evidenceText}`, NOT_PENDING_LINES), NO_FAILURES)),
    ),
    lastCommit: [...tasks].reverse().find((t) => t.commit)?.commit || null,
    parsed: tasks.length > 0 || Object.keys(sections).length > 0,
  };
}
