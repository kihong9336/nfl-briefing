import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

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

test('the site installs on iPhone with the selected football app icon', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  const iconPaths = [
    '../assets/icons/apple-touch-icon.png',
    '../assets/icons/icon-192.png',
    '../assets/icons/icon-512.png',
  ];

  assert.match(index, /rel="apple-touch-icon" href="\.\/assets\/icons\/apple-touch-icon\.png"/);
  assert.match(index, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(index, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.equal(manifest.name, 'NFL 브리핑');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);
  for (const path of iconPaths) {
    const url = new URL(path, import.meta.url);
    assert.equal(existsSync(url), true, `${path} should exist`);
    assert.ok(statSync(url).size > 1_000, `${path} should contain a real icon`);
  }
});

test('the installed web app refreshes deployed assets instead of keeping a stale iPhone cache', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

  assert.match(index, /styles\.css\?v=[a-z0-9-]+/i);
  assert.match(index, /src\/app\.js\?v=[a-z0-9-]+/i);
  assert.match(app, /navigator\.serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(app, /updateViaCache:\s*'none'/);
  assert.match(worker, /skipWaiting\(\)/);
  assert.match(worker, /clients\.claim\(\)/);
  assert.match(worker, /cache:\s*'no-store'/);
});

test('the mobile home uses an app-style digest without removing the full briefing', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const edition = briefingForDate('2026-10-17', publishedBriefings);

  assert.match(index, /id="mobileDigest"/);
  assert.match(index, /class="mobile-tabbar"/);
  assert.match(index, /href="#storyList"/);
  assert.match(index, /href="#mobileSchedule"/);
  assert.match(index, /href="#tactics"/);
  assert.match(app, /function renderMobileDigest/);
  assert.match(app, /digest-story-rail/);
  assert.match(app, /mobile-game-rail/);
  assert.match(app, /story-detail-/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /padding-bottom:\s*calc\([^;]*safe-area-inset-bottom/);
  assert.match(css, /\.mobile-tabbar/);
  assert.match(index, /id="storySheet"/);
  assert.match(index, /id="storySheetClose"/);
  assert.match(app, /data-story-id/);
  assert.match(app, /storySheet\.showModal\(\)/);
  assert.match(app, /storySheetContent/);
  assert.doesNotMatch(app, /class="digest-card[^\"]*" href="#story-detail-/);
  assert.match(css, /\.story-sheet::backdrop/);
  assert.match(css, /\.story-sheet-bar\s*\{[^}]*position:\s*sticky/s);
  assert.match(css, /\.date-chip\s*\{[^}]*display:\s*grid[^}]*align-items:\s*center/s);
  assert.match(css, /\.date-chip small\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.filter-row\s*\{[^}]*top:\s*98px/s);
  assert.match(css, /\.edition-header h1\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.lead-story h2\s*\{[^}]*font-size:\s*24px/s);
  assert.match(css, /\.digest-story-rail\s*\{[^}]*grid-auto-columns:\s*86%/s);
  assert.match(css, /\.mobile-tabbar a\.is-active\s*\{[^}]*background:/s);
  assert.equal(edition.sections.length, 4);
  assert.equal(edition.schedule.length, 4);
});

test('published editions expose source links and hide the sample warning', () => {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.match(index, /id="demoNotice"/);
  assert.match(app, /story-sources/);
  assert.match(app, /briefing\.sample/);
});

test('the sidebar uses its space for league-wide news instead of static filler', () => {
  const edition = briefingForDate('2026-10-16', publishedBriefings);
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(edition.leagueWide?.length >= 2);
  assert.ok(edition.leagueWide.every((item) => !['49ers', 'Chiefs', 'Patriots'].includes(item.team)));
  assert.ok(edition.leagueWide.every((item) => item.title && item.why && item.url));
  assert.match(app, /리그 와이드/);
  assert.match(app, /leagueWide/);
  assert.match(app, /escapeHtml/);
  assert.doesNotMatch(index, /OUR TEAMS|텔레그램에는/);
});

test('the upcoming games board clearly labels KST dates, weekdays, and status', () => {
  const edition = briefingForDate('2026-10-16', publishedBriefings);
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(edition.schedule.every((game) => game.date && game.weekday && game.time));
  assert.match(app, /다가오는 경기 일정/);
  assert.match(app, /모든 시간 KST/);
  assert.match(app, /경기 예정/);
  assert.match(app, /item\.status/);
});

test('new links have an explicit visible focus treatment', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.quick-hit:focus-visible/);
  assert.match(css, /\.tactic-source a:focus-visible/);
});

test('published tactics contain a real play explanation instead of a generic external link', () => {
  const edition = briefingForDate('2026-10-16', publishedBriefings);
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(edition.tactics.every((item) => item.diagram?.kind));
  assert.ok(edition.tactics.every((item) => item.breakdown?.length >= 3));
  assert.ok(edition.tactics.every((item) => item.whyItWorks && item.defenseCounter));
  assert.ok(edition.tactics.every((item) => item.watchOrder?.length >= 3));
  assert.match(app, /renderTacticDiagram/);
  assert.match(app, /play-steps/);
  assert.match(app, /설명 근거/);
  assert.doesNotMatch(app, /class="tactic-diagram" aria-hidden="true"/);
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
