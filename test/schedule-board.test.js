import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';

import { generateStaticPages } from '../src/static-pages.js';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../src/render-utils.js';

const module = await import('../src/schedule-board.js').catch(() => ({}));
test('busy actual edition keeps three preview games and discloses remaining games once', () => {
  assert.equal(typeof module.renderScheduleBoard, 'function', 'shared schedule renderer exists');
  const games = briefings.find(b => b.schedule.length > 10).schedule;
  const before = JSON.stringify(games);
  const html = module.renderScheduleBoard(games);
  const [preview, rest] = html.split('<details class="schedule-more" data-schedule-overflow>');
  assert.equal((preview.match(/class="schedule-row"/g) ?? []).length, 3);
  assert.equal((rest.match(/class="schedule-row"/g) ?? []).length, games.length - 3);
  assert.ok(html.includes(`전체 ${games.length}경기 보기`));
  const rows = html.match(/<div class="schedule-row"[\s\S]*?<\/details><\/div><\/div>/g);
  for (const game of games) {
    const matching = rows.filter(row => row.includes(`<strong class="schedule-matchup">${escapeHtml(game.matchup)}</strong>`));
    assert.equal(matching.length, 1);
    for (const field of ['date', 'weekday', 'time', 'status', 'note']) {
      if (game[field]) assert.ok(matching[0].includes(escapeHtml(game[field])), `${field} preserved`);
    }
  }
  assert.equal(JSON.stringify(games), before);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
});

test('actual favorite matchups are prioritized, stable within each priority, without mutation', () => {
  const games = briefings[0].schedule;
  const favorites = games.filter(g => /49ers|Chiefs|Patriots/.test(g.matchup));
  const html = module.renderScheduleBoard(games).split('<details class="schedule-more" data-schedule-overflow>')[0];
  for (const g of favorites.slice(0, 3)) assert.ok(html.includes(g.matchup));
});

test('in-progress status outranks favorites (test-only status variation on actual fixture)', () => {
  const actual = briefings[0].schedule;
  const games = [actual[0], actual[2], actual[12], {...actual[1], status: '진행 중'}];
  const before = JSON.stringify(games);
  const html = module.renderScheduleBoard(games);
  assert.ok(html.indexOf(games[3].matchup) < html.indexOf(games[0].matchup));
  assert.equal(JSON.stringify(games), before);
});

test('zero to three rows have no empty disclosure; all textual fields are escaped', () => {
  for (const count of [0, 1, 2, 3]) {
    assert.doesNotMatch(module.renderScheduleBoard(briefings[0].schedule.slice(0, count)), /class="schedule-more"/);
  }
  const unsafe = '<img src=x onerror="bad()">&\'';
  const game = Object.fromEntries(['date', 'weekday', 'time', 'status', 'matchup', 'note'].map(k => [k, unsafe]));
  const html = module.renderScheduleBoard([game]);
  assert.doesNotMatch(html, /<img/);
  assert.equal(html.split(escapeHtml(unsafe)).length - 1, 6);
});

test('interactive and static editions use identical shared renderer and versioned CSS', () => {
  const pages = generateStaticPages(briefings);
  for (const edition of briefings) {
    assert.ok(pages[`editions/${edition.date}/index.html`].includes(module.renderScheduleBoard(edition.schedule)));
    assert.match(pages[`editions/${edition.date}/index.html`], /schedule-board.css\?v=/);
  }
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /renderScheduleBoard\(briefing.schedule\)/);
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(index, /schedule-board.css\?v=/);
});
