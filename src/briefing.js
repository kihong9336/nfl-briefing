export function availableDates(briefings) {
  return briefings.map((briefing) => briefing.date).sort().reverse();
}

export function normalizeDateParam(value, briefings) {
  const dates = availableDates(briefings);
  return dates.includes(value) ? value : dates[0];
}

export function briefingForDate(date, briefings) {
  return briefings.find((briefing) => briefing.date === date) ?? null;
}

export function neighboringDates(date, briefings) {
  const dates = availableDates(briefings).reverse();
  const index = dates.indexOf(date);
  if (index === -1) return { older: null, newer: null };
  return {
    older: index > 0 ? dates[index - 1] : null,
    newer: index < dates.length - 1 ? dates[index + 1] : null,
  };
}

// Headlines are editorial navigation, not a partition of the canonical categories.
export function partitionNews(briefing, filter = 'all') {
  const sections = briefing.sections ?? [];
  const leagueItems = briefing.leagueWide ?? [];
  const isFavorite = story => ['49ers', 'Chiefs', 'Patriots'].includes(story.team);
  const stories = sections.map(item => ({kind: 'story', item}));
  const league = leagueItems.map(item => ({kind: 'league', item}));
  const all = [...stories, ...league];
  // Older editions: stable interleaving, not an assertion of editorial importance.
  const fallback = [];
  for (let i = 0; i < Math.max(stories.length, league.length); i++) {
    if (stories[i]) fallback.push(stories[i]);
    if (league[i]) fallback.push(league[i]);
  }
  const editorial = Array.isArray(briefing.topStoryKeys);
  const selected = editorial
    ? briefing.topStoryKeys.map(key => all.find(entry => entry.item.eventKey === key || entry.item.id === key)).filter(Boolean)
    : fallback;
  const headlines = [...new Set(selected)].slice(0, 5);
  return {
    headlines, editorial,
    topStories: headlines.filter(entry => entry.kind === 'story').map(entry => entry.item),
    topLeague: headlines.filter(entry => entry.kind === 'league').map(entry => entry.item),
    leagueStories: sections.filter(story => !isFavorite(story)),
    leagueItems,
    favorites: sections.filter(story => isFavorite(story) && (filter === 'all' || story.team === filter)),
  };
}

export function filterSections(sections, filter) {
  if (!filter || filter === 'all') return sections;
  return sections.filter((section) => section.team === 'NFL' || section.team === filter);
}

export function filterTactics(tactics, filter) {
  if (!filter || filter === 'all') return tactics;
  return tactics.filter((item) => item.team === 'NFL' || item.team === filter);
}
