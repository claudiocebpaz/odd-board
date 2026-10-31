// Parses an ODD feature document (odd/tasks/<feature>.md) into a board card.
//
// ODD does not define a fixed schema or a status field for feature documents.
// What it does guarantee: sections (objective, scope, tasks, evidence, progress,
// next step) and checkboxes that are only checked with observed proof.
// So this parser is deliberately tolerant: counts come from checkboxes
// (deterministic), and everything else is best-effort.

const CHECKBOX = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const COMMIT = /\b([0-9a-f]{7,40})\b/;

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

const PENDING_CHECK_HINTS = [
  /\bfail(ed|ing)?\b/i,
  /\bfall[oó]\b/i,
  /\bpending (check|verification|review)/i,
  /\bverificaci[oó]n pendiente\b/i,
  /\bchequeo pendiente\b/i,
  /\breview pending\b/i,
];

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
  for (const line of lines) {
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

  for (const line of lines) {
    const h = line.match(HEADING);
    if (h) {
      if (!title && h[1].length === 1) title = h[2];
      current = sectionKey(h[2]);
      if (current && !sections[current]) sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);

    const c = line.match(CHECKBOX);
    if (c) {
      const text = c[2].trim();
      const idMatch = text.match(/^\*{0,2}([A-Z]{1,4}-?\d+(?:\.\d+)*)\*{0,2}[:.)\s-]\s*/);
      const commit = text.match(COMMIT);
      const label = (idMatch ? text.slice(idMatch[0].length) : text)
        .replace(/\s*[—–-]*\s*\(?\s*(evidence|evidencia|commit)\s*:?\s*`?[0-9a-f]{7,40}`?\s*\)?\s*$/i, '')
        .trim();
      tasks.push({
        id: idMatch ? idMatch[1] : `${tasks.length + 1}`,
        text: label,
        done: c[1].toLowerCase() === 'x',
        commit: commit ? commit[1].slice(0, 7) : null,
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
    blocked: BLOCKED_HINTS.some((p) => p.test(statusText)),
    pendingChecks: PENDING_CHECK_HINTS.some((p) => p.test(`${statusText}\n${evidenceText}`)),
    lastCommit: [...tasks].reverse().find((t) => t.commit)?.commit || null,
    parsed: tasks.length > 0 || Object.keys(sections).length > 0,
  };
}
