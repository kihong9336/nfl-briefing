// Deliberately deterministic: event identity is supplied by the researching editor.
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const text = item => [item.summary, item.why].filter(Boolean).join(' ');
const items = edition => [...(edition.sections ?? []), ...(edition.leagueWide ?? [])];
function canonical(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/.test(key)) parsed.searchParams.delete(key);
    parsed.hash = '';
    return parsed.href.replace(/\/$/, '');
  } catch { return ''; }
}
const urls = item => [...(item.sources ?? []).map(source => source.url), item.url].filter(Boolean).map(canonical).filter(Boolean);
function isEventSource(url) {
  const parts = new URL(url).pathname.toLowerCase().split('/').filter(Boolean);
  // Rolling hubs aggregate distinct injuries, previews and results for one game.
  return parts.length >= 2 && !parts.some(part => /^(game-day|gameday|game-center|gamecenter|schedule|schedules|injury-report|injury-reports|injuries)$/.test(part));
}
function sameEvent(a, b) {
  if (normalize(text(a)).length > 20 && normalize(text(a)) === normalize(text(b))) return true;
  if (a.eventKey && b.eventKey) return a.eventKey === b.eventKey;
  // A generic landing page or a matching headline alone is not an event identity.
  const sharedSource = urls(a).some(url => isEventSource(url) && urls(b).includes(url));
  return (sharedSource && normalize(a.team) === normalize(b.team)) || (normalize(text(a)).length > 20 && normalize(text(a)) === normalize(text(b)));
}
function changed(item, previous) {
  const evidence = item.changeEvidence;
  if (!item.changeSummary?.trim() || !evidence) return false;
  const { before, after, quote, url } = evidence;
  if (![before, after, quote, url].every(value => typeof value === 'string' && value.trim())) return false;
  const oldFact = normalize(before), newFact = normalize(after);
  return oldFact.length >= 4 && newFact.length >= 4 && !oldFact.includes(newFact) && !newFact.includes(oldFact)
    && normalize(text(previous)).includes(oldFact)
    && !normalize(text(previous)).includes(newFact)
    && normalize(text(item)).includes(newFact)
    && normalize(quote).includes(newFact)
    && urls(item).includes(canonical(url));
}
export function repeatedPublicationEvent(briefings, edition, item) {
  const cutoff = Date.parse(edition.date) - 7 * 86400000;
  const recent = briefings.filter(old => old.sample === false && old.date < edition.date && Date.parse(old.date) >= cutoff).sort((a,b) => b.date.localeCompare(a.date));
  const previous = recent.flatMap(old => items(old).map(story => ({story, date: old.date}))).find(({story}) => sameEvent(item, story));
  return previous && !changed(item, previous.story) ? previous : null;
}
export function guardPublication(briefings, edition) {
  const current = items(edition);
  for (let i = 0; i < current.length; i++) {
    for (const earlier of current.slice(0, i)) {
      if (sameEvent(current[i], earlier)) throw new Error(`repeated event within edition: ${current[i].eventKey || current[i].title}; merge coverage`);
    }
  }
  for (const item of current) {
    const previous = repeatedPublicationEvent(briefings, edition, item);
    if (previous) throw new Error(`repeated event: ${item.eventKey || item.title} (${previous.date}); supply source-verified changeSummary and changeEvidence or omit`);
  }
}
