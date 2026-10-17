import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { generateStaticPages } from '../src/static-pages.js';

test('archive groups actual season/week metadata and separates samples without inventing weeks', () => {
  const pages = generateStaticPages(briefings);
  const archive = pages['editions/index.html'];
  assert.ok(archive);
  assert.match(archive, /2026 시즌 · WEEK 6/);
  assert.match(archive, /샘플 · 시즌\/주차 미지정/);
  for (const edition of briefings) assert.ok(archive.includes(`editions/${edition.date}/`));
  assert.deepEqual(pages, generateStaticPages([...briefings].reverse()));
});

test('explicit metadata overrides edition label, with per-field fallback', () => {
  const edition = {...briefings[0], edition: '2025 WEEK 4', season: 2026, week: 7};
  assert.match(generateStaticPages([edition])['editions/index.html'], /2026 시즌 · WEEK 7/);
  delete edition.week;
  assert.match(generateStaticPages([edition])['editions/index.html'], /2026 시즌 · WEEK 4/);
});

test('all content is escaped, unsafe URLs are never links, and unsafe dates are rejected', () => {
  const edition = structuredClone(briefings[0]);
  edition.lead.title = '<script>alert("x")</script>';
  edition.sections[0].sources = [{ label: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)' }, { label: 'Safe & sound', url: 'https://example.com/?a=1&b=2' }];
  const html = generateStaticPages([edition])[`editions/${edition.date}/index.html`];
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
  assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'));
  assert.throws(() => generateStaticPages([{ ...edition, date: '../../escape' }]), /date/);
  assert.throws(() => generateStaticPages([{ ...edition, date: '2026-02-30' }]), /date/);
  assert.throws(() => generateStaticPages([edition, edition]), /duplicate/);
});

test('dated pages contain original text, source links and date-specific crawler metadata without JS', async () => {
  const { generateStaticPages } = await import('../src/static-pages.js');
  const pages = generateStaticPages(briefings);
  for (const edition of briefings) {
    const html = pages[`editions/${edition.date}/index.html`];
    assert.ok(html);
    assert.ok(html.includes(`<time datetime="${edition.date}">${edition.date}</time>`));
    assert.ok(html.includes(`https://kihong9336.github.io/nfl-briefing/editions/${edition.date}/`));
    assert.ok(html.includes(`href="https://kihong9336.github.io/nfl-briefing/?date=${edition.date}"`));
    assert.ok(html.includes(edition.lead.title));
    assert.ok(html.includes(edition.lead.summary));
    assert.ok(html.includes('property="og:title"'));
    assert.ok(html.includes('property="og:description"'));
    assert.match(html, /property="og:image" content="https:\/\/kihong9336.github.io\/nfl-briefing\/assets\/icons\//);
    assert.doesNotMatch(html, /<script\b/);
    assert.equal(html.includes('data-sample-warning'), edition.sample !== false);
    for (const story of edition.sections) {
      assert.ok(html.includes(story.commentary));
      for (const source of story.sources ?? []) assert.ok(html.includes(`href="${source.url}"`));
    }
  }
  assert.notEqual(pages['editions/2026-10-17/index.html'].match(/property="og:title" content="([^"]+)"/)[1], pages['editions/2026-10-16/index.html'].match(/property="og:title" content="([^"]+)"/)[1]);
});
