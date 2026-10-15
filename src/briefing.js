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

export function filterSections(sections, filter) {
  if (!filter || filter === 'all') return sections;
  return sections.filter((section) => section.team === 'NFL' || section.team === filter);
}
