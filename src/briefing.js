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

// The headline selection is edition-wide; the team filter applies only to remaining favorites.
export function partitionNews(briefing, filter = 'all') {
  const topStories = briefing.sections.slice(0, 3);
  const topLeague = (briefing.leagueWide ?? []).slice(0, 1);
  const remaining = briefing.sections.slice(3);
  return {
    topStories, topLeague,
    leagueStories: remaining.filter(story => story.team === 'NFL'),
    leagueItems: (briefing.leagueWide ?? []).slice(1),
    favorites: remaining.filter(story => story.team !== 'NFL' && (filter === 'all' || story.team === filter)),
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
