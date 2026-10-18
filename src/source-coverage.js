const FAMILIES = ['espn.com', 'apnews.com', 'cbssports.com', 'nbcsports.com', 'sports.yahoo.com', 'nfl.com'];
const family = host => FAMILIES.find(base => host === base || host.endsWith(`.${base}`));
const text = value => typeof value === 'string' && value.trim().length > 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const normalizeHost = host => host.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');

export function auditSourceCoverage(audit, { expectedDate } = {}) {
  if (!audit || !validDate(audit.date)) throw new Error('Invalid audit date; expected YYYY-MM-DD.');
  if (expectedDate !== undefined && (!validDate(expectedDate) || expectedDate !== audit.date)) throw new Error('Audit date does not match expected date.');
  if (!Array.isArray(audit.coverage)) throw new Error('coverage must be an array.');
  const end = Date.parse(`${audit.date}T23:59:59.999+09:00`);
  const coverage = audit.coverage.map((row, index) => {
    const fail = field => { throw new Error(`coverage[${index}]: invalid ${field}.`); };
    if (!row || !text(row.name)) fail('name');
    if (!['retrieved', 'blocked', 'failed'].includes(row.status)) fail('status');
    if (row.status !== 'retrieved' && !text(row.note)) fail('note');
    if (!text(row.domain) || !/^[a-zA-Z0-9.-]+$/.test(row.domain)) fail('domain');
    let url;
    try { url = new URL(row.url); } catch { fail('url'); }
    if (url.protocol !== 'https:' || url.username || url.password || normalizeHost(url.hostname) !== normalizeHost(row.domain)) fail('HTTPS URL/domain');
    const stamp = row.checkedAt;
    if (typeof stamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(stamp) || !validDate(stamp.slice(0, 10))) fail('checkedAt');
    const checked = Date.parse(stamp);
    if (!Number.isFinite(checked) || checked > end || checked < end - 48 * 60 * 60 * 1000) fail('checkedAt (outside 48-hour edition-end KST window)');
    return { ...row, domain: normalizeHost(url.hostname) };
  });
  audit = { ...audit, coverage };
  const attempted = new Set(audit.coverage.map(row => family(row.domain)).filter(Boolean));
  const retrieved = new Set(audit.coverage.filter(row => row.status === 'retrieved').map(row => family(row.domain)).filter(Boolean));
  if (attempted.size < 4) throw new Error('At least 4 distinct approved newsroom families must be attempted.');
  return { date: audit.date, status: retrieved.size >= 2 ? 'complete' : 'partial', label: 'Self-reported source coverage audit', counts: { attemptedFamilies: attempted.size, retrievedFamilies: retrieved.size }, warnings: ['Complete refers to breadth, not exhaustiveness.', 'Self-reported checks are not proof of article correctness.'] };
}
