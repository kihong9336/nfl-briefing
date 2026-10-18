import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { briefings } from '../src/data.js';
const base = process.env.BASE_URL || 'http://localhost:4173';
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome', headless: true });
try {
  for (const width of [320, 375, 390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 850 }, serviceWorkers: 'block' });
    await page.goto(base);
    await page.waitForSelector('#storyList .story');
    const tabs = page.locator('.mobile-tabbar a');
    assert.deepEqual(await tabs.evaluateAll(nodes => nodes.map(n => [n.textContent.replace(/\d/g,'').trim(), n.hash])), [['오늘','#main'],['경기','#scheduleBoard'],['리그','#leagueWide'],['내 팀','#favoriteTeams'],['전술','#tactics']]);
    if (width < 561) {
      for (const tab of await tabs.all()) {
        const box = await tab.boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.height >= 44, 'five accessible tabs fit viewport');
      }
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    const takeaways = page.locator('#storyList .story-takeaway');
    assert.equal(await takeaways.count(), 0, 'takeaways appear once in roundup, not as arbitrary article excerpts');
    await page.locator('#storyList [data-story-id]').first().click();
    assert.equal(await page.locator('.story-stage').count(), 3);
    const edition = briefings.find(item => item.date === new URL(page.url()).searchParams.get('date')) || briefings[0];
    assert.equal(await page.locator('.story-stage p').nth(2).textContent(), edition.sections.find(item => item.team !== 'NFL').watch, 'full watch text preserved');
    assert.equal(await page.locator('.story-stage').nth(2).getAttribute('open'), null);
    assert.equal(await page.locator('.story-stage').nth(0).getAttribute('open'), '');
    assert.equal(await page.locator('.story-stage').nth(1).getAttribute('open'), null);
    assert.match(await page.locator('.story-stage summary').nth(0).textContent(), /무슨 일인가/);
    assert.match(await page.locator('.story-stage summary').nth(1).textContent(), /왜 중요한가/);
    assert.match(await page.locator('.story-stage summary').nth(2).textContent(), /경기에서 볼 것/);
    await page.locator('.story-stage summary').nth(1).click();
    assert.equal(await page.locator('.story-stage').nth(1).getAttribute('open'), '');
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#storySheet').open);
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('#storySheet').open);
    await page.locator('#storySheetClose').click();
    await page.waitForFunction(() => !document.querySelector('#storySheet').open);
    assert.equal(await page.locator('.tactic-trigger').count(), await page.locator('.tactic-card').count(), 'each tactic has a watch trigger');
    for (const card of await page.locator('.tactic-card').all()) {
      assert.ok((await card.locator('.tactic-trigger').textContent()).trim());
      assert.ok(await card.locator('.tactic-trigger').evaluate(node => getComputedStyle(node).whiteSpace !== 'nowrap' && node.scrollHeight <= node.clientHeight + 1), 'complete watch trigger is readable without clipping');
      assert.ok(await card.locator('.tactic-figure').isVisible());
      assert.equal(await card.locator('.tactic-deep').getAttribute('open'), null);
    }
    for (const item of edition.tactics ?? []) assert.ok((await page.locator('.tactic-deep').allTextContents()).some(text => text.includes(item.concept)), 'full tactic concept preserved');
    assert.ok(await page.locator('a[href="./editions/"]').isVisible());
    assert.equal(await page.locator('#editionShare').getAttribute('href'), `./editions/${edition.date}/`);
    const original = await page.locator('#datePicker').inputValue();
    await page.locator('[data-filter="Chiefs"]').click();
    assert.equal(new URL(page.url()).searchParams.get('team'), 'Chiefs');
    await page.goBack();
    await page.waitForFunction(() => !new URL(location).searchParams.has('team'));
    await page.goForward();
    await page.waitForFunction(() => new URL(location).searchParams.get('team') === 'Chiefs');
    const dates = await page.locator('[data-date]').evaluateAll(nodes => nodes.map(n => n.dataset.date));
    const older = dates.find(date => date !== original);
    if (older) {
      await page.locator(`#dateRail [data-date="${older}"]`).click();
      assert.equal(await page.locator('#datePicker').inputValue(), older);
      await page.goBack();
      await page.waitForFunction(date => document.querySelector('#datePicker').value === date, original);
    }
    assert.ok(await page.locator('#archiveSelect option').count() >= dates.length);
    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto(base);
    assert.equal(await noJs.locator('#demoNotice').isVisible(), false, 'root must not falsely announce a demo before JS');
    await noJs.close();
    await page.locator('[data-filter="all"]').click();
    for (const date of dates) {
      await page.selectOption('#archiveSelect', date);
      assert.equal(await page.locator('#datePicker').inputValue(), date);
      assert.ok((await page.locator('#storyList').textContent()).trim());
    }
    await page.close();
    console.log(`PASS mobile UX ${width}px`);
  }
} finally { await browser.close(); }
