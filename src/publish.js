const REQUIRED_EDITION_FIELDS = ['date', 'weekday', 'edition', 'dek', 'lead', 'sections', 'tactics', 'highlights', 'schedule', 'leagueWide'];
const REQUIRED_STORY_FIELDS = ['id', 'team', 'label', 'title', 'summary', 'commentary', 'watch'];
const REQUIRED_TACTIC_FIELDS = ['id', 'team', 'label', 'title', 'concept', 'easy', 'gameUse', 'whyItWorks', 'defenseCounter'];
const CORE_TEAMS = new Set(['49ers', 'chiefs', 'patriots']);
const SUPPORTED_DIAGRAMS = new Set(['blitz-hot-read', 'back-shoulder']);
const GAME_STATUSES = new Set(['경기 예정', '진행 중', '종료', '연기', '취소']);
const FULL_WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const SHORT_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (/[<>]/.test(value)) throw new Error(`${label} must not contain HTML markup`);
}

function requireMeaningful(value, label, minimumLength) {
  requireString(value, label);
  if (value.trim().length < minimumLength) {
    throw new Error(`${label} must have meaningful length of at least ${minimumLength}`);
  }
  const substantiveCharacters = value.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  if (substantiveCharacters < 2) {
    throw new Error(`${label} must contain substantive letters or numbers`);
  }
}

function isCalendarDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function requireHttps(value, label) {
  requireString(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (url.protocol !== 'https:') throw new Error(`${label} must use https`);
}

export function validateEdition(edition) {
  if (!edition || typeof edition !== 'object' || Array.isArray(edition)) {
    throw new Error('edition must be an object');
  }

  for (const field of REQUIRED_EDITION_FIELDS) {
    if (!(field in edition)) throw new Error(`edition is missing ${field}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(edition.date)) throw new Error('date must use YYYY-MM-DD');
  const [editionYear, editionMonth, editionDay] = edition.date.split('-').map(Number);
  if (!isCalendarDate(editionYear, editionMonth, editionDay)) throw new Error('date must be a real calendar date');
  if (edition.sample !== false) throw new Error('published edition must set sample to false');
  requireString(edition.weekday, 'weekday');
  if (!/^(월요일|화요일|수요일|목요일|금요일|토요일|일요일)$/.test(edition.weekday)) {
    throw new Error('weekday must be a Korean weekday name');
  }
  const expectedEditionWeekday = FULL_WEEKDAYS[new Date(Date.UTC(editionYear, editionMonth - 1, editionDay)).getUTCDay()];
  if (edition.weekday !== expectedEditionWeekday) throw new Error('weekday must match the edition calendar date');
  requireMeaningful(edition.edition, 'edition', 8);
  requireMeaningful(edition.dek, 'dek', 12);
  for (const [field, minimum] of [['kicker', 3], ['title', 10], ['summary', 15]]) {
    requireMeaningful(edition.lead?.[field], `lead.${field}`, minimum);
  }

  if (!Array.isArray(edition.sections) || edition.sections.length === 0) {
    throw new Error('sections must contain at least one story');
  }

  for (const story of edition.sections) {
    for (const field of REQUIRED_STORY_FIELDS) requireString(story[field], `story.${field}`);
    if (story.update !== undefined) {
      if (!['new', 'status-change', 'followup'].includes(story.update?.kind)) throw new Error('story.update.kind is unsupported');
      requireHttps(story.update.evidence, 'story.update.evidence');
    }
    requireMeaningful(story.title, 'story.title', 8);
    requireMeaningful(story.summary, 'story.summary', 15);
    requireMeaningful(story.commentary, 'story.commentary', 15);
    requireMeaningful(story.watch, 'story.watch', 10);
    if (!Array.isArray(story.sources) || story.sources.length === 0) {
      throw new Error(`story ${story.id} must include at least one source`);
    }
    for (const source of story.sources) {
      requireString(source.label, 'source.label');
      requireHttps(source.url, 'source.url');
      if (source.publishedAt !== undefined) {
        requireString(source.publishedAt, 'source.publishedAt');
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(source.publishedAt) || !Number.isFinite(Date.parse(source.publishedAt))) throw new Error('source.publishedAt must be an ISO timestamp with timezone');
      }
    }
  }

  for (const field of ['tactics', 'highlights', 'schedule', 'leagueWide']) {
    if (!Array.isArray(edition[field])) throw new Error(`${field} must be an array`);
  }

  for (const tactic of edition.tactics) {
    for (const field of REQUIRED_TACTIC_FIELDS) requireString(tactic[field], `tactic.${field}`);
    requireString(tactic.diagram?.kind, 'tactic.diagram.kind');
    if (!SUPPORTED_DIAGRAMS.has(tactic.diagram.kind)) throw new Error(`unsupported tactic.diagram.kind: ${tactic.diagram.kind}`);
    requireMeaningful(tactic.diagram?.caption, 'tactic.diagram.caption', 10);
    requireMeaningful(tactic.title, 'tactic.title', 10);
    for (const field of ['concept', 'easy', 'gameUse', 'whyItWorks', 'defenseCounter']) {
      requireMeaningful(tactic[field], `tactic.${field}`, 15);
    }
    if (!Array.isArray(tactic.breakdown) || tactic.breakdown.length < 3) {
      throw new Error(`tactic ${tactic.id} breakdown must contain at least three explained steps`);
    }
    for (const step of tactic.breakdown) {
      requireString(step.label, 'tactic.breakdown.label');
      requireMeaningful(step.text, 'tactic.breakdown.text', 15);
    }
    if (!Array.isArray(tactic.watchOrder) || tactic.watchOrder.length < 3) {
      throw new Error(`tactic ${tactic.id} watchOrder must contain at least three points`);
    }
    for (const point of tactic.watchOrder) requireMeaningful(point, 'tactic.watchOrder', 5);
    requireString(tactic.source?.label, 'tactic.source.label');
    requireHttps(tactic.source?.url, 'tactic.source.url');
    if (tactic.video !== undefined) {
      requireMeaningful(tactic.video?.title, 'tactic.video.title', 5);
      requireMeaningful(tactic.video?.type, 'tactic.video.type', 5);
      requireHttps(tactic.video?.url, 'tactic.video.url');
    }
  }

  for (const game of edition.schedule) {
    for (const field of ['date', 'weekday', 'time', 'status', 'matchup', 'note']) requireString(game[field], `schedule.${field}`);
    if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(game.date)) throw new Error('schedule.date must use MM/DD');
    const [gameMonth, gameDay] = game.date.split('/').map(Number);
    const gameYear = gameMonth < editionMonth ? editionYear + 1 : editionYear;
    if (!isCalendarDate(gameYear, gameMonth, gameDay)) throw new Error('schedule.date must be a real calendar date');
    if (!/^[월화수목금토일]$/.test(game.weekday)) throw new Error('schedule.weekday must be one Korean weekday character');
    const expectedGameWeekday = SHORT_WEEKDAYS[new Date(Date.UTC(gameYear, gameMonth - 1, gameDay)).getUTCDay()];
    if (game.weekday !== expectedGameWeekday) throw new Error('schedule.weekday must match the calendar date');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(game.time)) throw new Error('schedule.time must use valid HH:mm KST');
    if (!GAME_STATUSES.has(game.status)) throw new Error('schedule.status is unsupported');
    requireMeaningful(game.matchup, 'schedule.matchup', 5);
    requireMeaningful(game.note, 'schedule.note', 10);
  }

  for (const video of edition.highlights) {
    for (const field of ['title', 'channel', 'type', 'note', 'url']) requireString(video[field], `highlight.${field}`);
    requireMeaningful(video.title, 'highlight.title', 5);
    requireMeaningful(video.channel, 'highlight.channel', 2);
    requireMeaningful(video.type, 'highlight.type', 3);
    requireMeaningful(video.note, 'highlight.note', 15);
    requireHttps(video.url, 'highlight.url');
  }

  if (edition.leagueWide.length < 2) {
    throw new Error('leagueWide must contain at least two useful items');
  }
  for (const item of edition.leagueWide) {
    for (const field of ['team', 'label', 'title', 'why', 'url']) requireString(item[field], `leagueWide.${field}`);
    if (CORE_TEAMS.has(item.team.trim().toLowerCase())) throw new Error('leagueWide must cover teams outside the three core teams');
    requireMeaningful(item.label, 'leagueWide.label', 3);
    requireMeaningful(item.title, 'leagueWide.title', 10);
    requireMeaningful(item.why, 'leagueWide.why', 15);
    requireHttps(item.url, 'leagueWide.url');
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
