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

// A commit reference next to "evidence"/"commit" or in backticks can be any
// hex string. A bare one must mix letters and digits, so numbers like
// "10000000 rows" or words like "defaced" are not taken for commits.
const COMMIT_IN_CONTEXT = [
  /\b(?:evidence|evidencia|commit)\b\s*:?\s*`?([0-9a-f]{7,40})\b/i,
  /`([0-9a-f]{7,40})`/,
];
const COMMIT_BARE = /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)([0-9a-f]{7,40})\b/;

const SECTION_ALIASES = {
  progress: [/progress/i, /progreso/i, /avance/i, /status/i, /estado/i],
  nextStep: [/next\s*step/i, /pr[oó]ximo\s*paso/i, /siguiente\s*paso/i],
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

const without = (text, patterns) => patterns.reduce((t, p) => t.replace(p, ' '), text);

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
  // Indentation of the last task checkbox. A deeper checkbox right below it is
  // a sub-item (acceptance criteria), not a task of its own.
  let taskIndent = null;

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
      if (!title && h[1].length === 1) title = h[2];
      current = sectionKey(h[2]);
      if (current && !sections[current]) sections[current] = [];
      taskIndent = null;
      continue;
    }
    if (current) sections[current].push(line);

    const c = line.match(CHECKBOX);
    if (c) {
      const indent = indentOf(c[1]);
      if (taskIndent !== null && indent > taskIndent) continue;
      taskIndent = indent;
      const text = c[3].trim();
      const idMatch = text.match(/^\*{0,2}([A-Z]{1,4}-?\d+(?:\.\d+)*)\*{0,2}[:.)\s-]\s*/);
      const commit = findCommit(text);
      const label = (idMatch ? text.slice(idMatch[0].length) : text)
        .replace(/\s*[—–-]*\s*\(?\s*(evidence|evidencia|commit)\s*:?\s*`?[0-9a-f]{7,40}`?\s*\)?\s*$/i, '')
        .trim();
      tasks.push({
        id: idMatch ? idMatch[1] : `${tasks.length + 1}`,
        text: label,
        done: c[2].toLowerCase() === 'x',
        commit: commit ? commit.slice(0, 7) : null,
      });
    }
  }

  const progressText = (sections.progress || []).join('\n');
  const nextStepText = (sections.nextStep || []).join('\n');
  const evidenceText = (sections.evidence || []).join('\n');
  const statusText = `${progressText}\n${nextStepText}`;

  const done = tasks.filter((t) => t.done).length;
  const nextStep = firstMeaningfulLine(sections.nextStep || []);

  // The first open task is the one in progress (ODD implements task by task).
  const firstOpen = tasks.find((t) => !t.done);
  if (firstOpen && done > 0) firstOpen.current = true;

  return {
    feature,
    file,
    title: title || feature,
    summary: frontmatter.summary || firstMeaningfulLine(sections.objective || []),
    frontmatterStatus: frontmatter.status || null,
    issue: frontmatter.issue || null,
    tasks,
    progress: { done, total: tasks.length },
    nextStep,
    blocked: BLOCKED_HINTS.some((p) => p.test(without(statusText, NOT_BLOCKED))),
    pendingChecks: PENDING_CHECK_HINTS.some((p) => p.test(without(`${statusText}\n${evidenceText}`, NO_FAILURES))),
    lastCommit: [...tasks].reverse().find((t) => t.commit)?.commit || null,
    parsed: tasks.length > 0 || Object.keys(sections).length > 0,
  };
}
