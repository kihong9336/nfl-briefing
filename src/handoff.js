// Validate the handoff contract, not the truth of the articles.
export function validateHandoff(input, audit, {date, notBefore} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || input?.date !== date || audit?.date !== date) throw new Error('handoff date mismatch');
  const cutoff = Date.parse(notBefore);
  if (!Number.isFinite(cutoff)) throw new Error('invalid handoff cutoff');
  const checkedAt = audit.checkedAt || audit.researchedAt;
  const reviewed = Date.parse(checkedAt);
  if (!Number.isFinite(reviewed) || reviewed < cutoff) throw new Error('stale or missing research checkedAt: fresh research required');
  const coverage = audit.gameCoverage;
  if (!coverage || (Array.isArray(coverage) ? !coverage.length : typeof coverage !== 'object' || !Object.keys(coverage).length)) throw new Error('missing gameCoverage: reconcile scoreboard before handoff');
  for (const name of ['tactics','highlights']) {
    if (!['selected','unavailable'].includes(audit.editorialCoverage?.[name]?.status)) throw new Error(`missing editorialCoverage.${name}: perform the review`);
  }
  return {status:'ready',date,checkedAt};
}
