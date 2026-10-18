import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const width of [320, 390, 1280]) {
    for (const date of ['2026-10-18', '2026-10-16', '2026-10-14']) {
      const page = await browser.newPage({viewport: {width, height: 850}, serviceWorkers: 'block'});
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.env.BASE_URL || 'http://localhost:4173'}/?date=${date}`);
      await page.waitForSelector('#leadTitle');
      const roundup = await page.locator('#leadStory').textContent();
      for (const title of await page.locator('#storyList h3, #leagueWide h3').allTextContents()) {
        assert.ok(!roundup.includes(title), 'roundup must not repeat article headline: '+title);
      }
      assert.equal(await page.locator('#leadStory .story-takeaway').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
      assert.equal(await page.locator('#leadStory [data-story-id], #leadStory [data-league-index]').count(), 0, 'overview contains no per-article copies');
      assert.equal(await page.locator('#leadStory a[href="#leagueWide"]').count(), 1);
      assert.equal(await page.locator('#leadStory a[href="#favoriteTeams"]').count(), 1);
      const counts = await page.evaluate(async date => {
        const {briefings} = await import('./src/data.js?v=20261018-dedupe1');
        const edition = briefings.find(item => item.date === date);
        return {league: (edition.leagueWide ?? []).length + edition.sections.filter(s => s.team === 'NFL').length, favorites: edition.sections.filter(s => s.team !== 'NFL').length,
          content: [...edition.sections, ...(edition.leagueWide ?? [])].flatMap(s => [s.takeaway, s.summary, s.commentary, s.why]).filter(Boolean)};
      }, date);
      assert.equal(await page.locator('#leadStory a[href="#leagueWide"]').textContent(), `리그 · ${counts.league}건 →`);
      assert.equal(await page.locator('#leadStory a[href="#favoriteTeams"]').textContent(), `관심 팀 · ${counts.favorites}건 →`);
      for (const text of counts.content) assert.ok(!roundup.includes(text), 'no article text in overview');
      assert.equal(await page.locator('#storyList button, #leagueWide button').count(), counts.league + counts.favorites);
      if (counts.league + counts.favorites) {
      await page.locator('#storyList button, #leagueWide button').first().click();
      assert.ok(await page.locator('#storySheet').isVisible());
      assert.ok((await page.locator('#storySheet .story-stage p').first().textContent()).length > 10);
      assert.ok(await page.locator('#storySheet .story-sources a').count() || date === '2026-10-14');
      await page.locator('#storySheetClose').click();
      await page.waitForFunction(() => !document.querySelector('#storySheet').open);
      }
      const league = await page.locator('#leagueWide').textContent();
      await page.locator('[data-filter="Chiefs"]').click();
      assert.equal(await page.locator('#leagueWide').textContent(), league);
      assert.deepEqual(errors, []);
      console.log(`PASS duplicate-content ${date} ${width}px`);
      await page.close();
    }
  }
  const page = await browser.newPage({serviceWorkers: 'block'});
  await page.route('**/src/data.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body: (await response.text()) + '\nbriefings[0].sections=[]; briefings[0].leagueWide=[]; delete briefings[0].editorialSummary;'});
  });
  await page.goto(`${process.env.BASE_URL || 'http://localhost:4173'}/`);
  await page.waitForSelector('#leadTitle');
  assert.match(await page.locator('#leadStory').innerText(), /총 0건/);
  assert.equal(await page.locator('#storyList button, #leagueWide button').count(), 0);
  assert.equal(await page.locator('#leadStory [data-story-id], #leadStory [data-league-index]').count(), 0);
  console.log('PASS zero-article edition');
  await page.close();
} finally { await browser.close(); }
