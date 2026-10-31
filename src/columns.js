// Board columns follow the ODD stages that leave a trace on disk.
// Authorize, Explore, Resolve uncertainty and Classify happen inside the agent
// session and never reach the file system, so they are not columns.
//
// Columns are never stored: they are derived from the feature document
// every time it changes. To move a card, the document has to change.

export const COLUMNS = [
  { id: 'tracked', title: 'Tracked', stage: 'Track' },
  { id: 'implementing', title: 'Implementing', stage: 'Implement' },
  { id: 'verifying', title: 'Verifying', stage: 'Close (in progress)' },
  { id: 'closed', title: 'Closed', stage: 'Close' },
];

const FRONTMATTER_MAP = {
  planned: 'tracked',
  tracked: 'tracked',
  'in-progress': 'implementing',
  implementing: 'implementing',
  verifying: 'verifying',
  review: 'verifying',
  done: 'closed',
  closed: 'closed',
};

export function columnFor(card) {
  // Optional convention on top of ODD: an explicit `status` in frontmatter wins.
  const explicit = card.frontmatterStatus && FRONTMATTER_MAP[card.frontmatterStatus.toLowerCase()];
  if (explicit) return explicit;

  const { done, total } = card.progress;
  if (total === 0 || done === 0) return 'tracked';
  if (done < total) return 'implementing';
  return card.pendingChecks || card.blocked ? 'verifying' : 'closed';
}

export function isBlocked(card) {
  if (card.frontmatterStatus && card.frontmatterStatus.toLowerCase() === 'blocked') return true;
  return card.blocked;
}
