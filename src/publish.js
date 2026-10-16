const REQUIRED_EDITION_FIELDS = ['date', 'weekday', 'edition', 'dek', 'lead', 'sections', 'tactics', 'highlights', 'schedule'];
const REQUIRED_STORY_FIELDS = ['id', 'team', 'label', 'title', 'summary', 'commentary', 'watch'];

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function validateEdition(edition) {
  if (!edition || typeof edition !== 'object' || Array.isArray(edition)) {
    throw new Error('edition must be an object');
  }

  for (const field of REQUIRED_EDITION_FIELDS) {
    if (!(field in edition)) throw new Error(`edition is missing ${field}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition.date)) {
    throw new Error('date must use YYYY-MM-DD');
  }
  if (edition.sample !== false) {
    throw new Error('published edition must set sample to false');
  }
  if (!Array.isArray(edition.sections) || edition.sections.length === 0) {
    throw new Error('sections must contain at least one story');
  }

  for (const story of edition.sections) {
    for (const field of REQUIRED_STORY_FIELDS) requireString(story[field], `story.${field}`);
    if (!Array.isArray(story.sources) || story.sources.length === 0) {
      throw new Error(`story ${story.id} must include at least one source`);
    }
    for (const source of story.sources) {
      requireString(source.label, 'source.label');
      requireString(source.url, 'source.url');
      const url = new URL(source.url);
      if (url.protocol !== 'https:') throw new Error('source URL must use https');
    }
  }

  for (const field of ['tactics', 'highlights', 'schedule']) {
    if (!Array.isArray(edition[field])) throw new Error(`${field} must be an array`);
  }

  return edition;
}

export function upsertEdition(briefings, edition) {
  validateEdition(edition);
  return [edition, ...briefings.filter((item) => item.date !== edition.date)]
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function serializeBriefings(briefings) {
  return `export const briefings = ${JSON.stringify(briefings, null, 2)};\n`;
}
