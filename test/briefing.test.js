import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  availableDates,
  briefingForDate,
  filterSections,
  filterTactics,
  neighboringDates,
  normalizeDateParam,
} from '../src/briefing.js';
import { briefings as publishedBriefings } from '../src/data.js';

const sample = [
  {
    date: '2026-10-15',
    sections: [
      { id: 'league', team: 'NFL', title: '리그 핵심 뉴스' },
      { id: 'sf', team: '49ers', title: '49ers 부상 업데이트' },
      { id: 'kc', team: 'Chiefs', title: 'Chiefs 라인 점검' },
      { id: 'ne', team: 'Patriots', title: 'Patriots 수비 점검' },
    ],
  },
  {
    date: '2026-10-16',
    sections: [{ id: 'next', team: 'NFL', title: '다음 경기 프리뷰' }],
  },
];

test('availableDates returns newest briefing first', () => {
  assert.deepEqual(availableDates(sample), ['2026-10-16', '2026-10-15']);
});

test('normalizeDateParam falls back to the newest available date', () => {
  assert.equal(normalizeDateParam('not-a-date', sample), '2026-10-16');
  assert.equal(normalizeDateParam(null, sample), '2026-10-16');
});

test('briefingForDate returns the requested briefing', () => {
  assert.equal(briefingForDate('2026-10-15', sample).date, '2026-10-15');
});

test('neighboringDates returns older and newer archive links', () => {
  assert.deepEqual(neighboringDates('2026-10-15', sample), {
    older: null,
    newer: '2026-10-16',
  });
  assert.deepEqual(neighboringDates('2026-10-16', sample), {
    older: '2026-10-15',
    newer: null,
  });
});

test('filterSections keeps league news and selected team focus', () => {
  const sections = sample[0].sections;
  assert.deepEqual(
    filterSections(sections, '49ers').map((section) => section.id),
    ['league', 'sf'],
  );
  assert.deepEqual(
    filterSections(sections, 'Chiefs').map((section) => section.id),
    ['league', 'kc'],
  );
  assert.deepEqual(
    filterSections(sections, 'Patriots').map((section) => section.id),
    ['league', 'ne'],
  );
  assert.equal(filterSections(sections, 'all').length, 4);
});

test('filterTactics keeps universal concepts and selected team examples', () => {
  const tactics = [
    { id: 'coverage', team: 'NFL' },
    { id: 'sf-motion', team: '49ers' },
    { id: 'kc-protection', team: 'Chiefs' },
    { id: 'ne-defense', team: 'Patriots' },
  ];
  assert.deepEqual(
    filterTactics(tactics, '49ers').map((item) => item.id),
    ['coverage', 'sf-motion'],
  );
  assert.deepEqual(
    filterTactics(tactics, 'Chiefs').map((item) => item.id),
    ['coverage', 'kc-protection'],
  );
  assert.deepEqual(
    filterTactics(tactics, 'Patriots').map((item) => item.id),
    ['coverage', 'ne-defense'],
  );
  assert.equal(filterTactics(tactics, 'all').length, 4);
});

test('published copy consistently announces the 08:00 KST update', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const data = readFileSync(new URL('../src/data.js', import.meta.url), 'utf8');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const publishedCopy = `${index}\n${data}\n${readme}`;

  assert.match(index, /DAILY · 08:00 KST/);
  assert.match(index, /data-filter="Patriots"/);
  assert.match(data, /매일 오전 8시 업데이트/);
  assert.match(readme, /매일 오전 8시/);
  assert.doesNotMatch(publishedCopy, /12:00 KST|매일 낮 12시/);
});

test('published editions expose source links and hide the sample warning', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.match(index, /id="demoNotice"/);
  assert.match(app, /story-sources/);
  assert.match(app, /briefing\.sample/);
});

test('the public archive includes a verified, non-sample 2026-10-16 edition', () => {
  const edition = briefingForDate('2026-10-16', publishedBriefings);

  assert.equal(edition?.sample, false);
  assert.equal(edition?.date, '2026-10-16');
  assert.ok(edition.sections.length >= 4);
  assert.deepEqual(
    [...new Set(edition.sections.map((section) => section.team))].sort(),
    ['49ers', 'Chiefs', 'NFL', 'Patriots'].sort(),
  );
  assert.ok(edition.sections.every((section) => section.sources?.length));
  assert.ok(edition.tactics.length >= 2);
  assert.ok(edition.highlights.length >= 2);
});
