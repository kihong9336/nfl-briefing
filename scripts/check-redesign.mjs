import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await mkdir('docs/screenshots/redesign-review',{recursive:true});
try {
for (const width of [390,375,320,1280]) {
 await page.setViewportSize({width,height:844});
 await page.goto('http://127.0.0.1:4175/?date=2026-10-17');
 await page.waitForSelector('#storyList button');
 const order=await page.locator('#leadStory,#scheduleBoard,#leagueWide,#storyList,#tactics,#highlights').evaluateAll(els=>els.map(e=>e.id));
 assert.deepEqual(order,['leadStory','scheduleBoard','leagueWide','storyList','tactics','highlights']);
 assert.equal(await page.locator('#mobileSchedule').count(),0);
 assert.equal(await page.locator('#storyList .analysis').count(),0);
 assert.ok(await page.locator('#leadStory [data-story-id]').count()>1);
 assert.equal(await page.locator('#tactics details[open]').count(),0);
 assert.equal(await page.locator('#tactics .tactic-figure').first().isVisible(),true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#storyList button[data-story-id]').first().scrollIntoViewIfNeeded();
 const scrollBefore = await page.evaluate(()=>scrollY);
 await page.locator('#storyList button[data-story-id]').first().click();
 assert.ok(await page.locator('#storySheet').evaluate(e=>e.open));
 assert.equal(await page.locator('#storySheetClose').evaluate(e=>e===document.activeElement),true);
 await page.locator('.glossary summary').click();
 assert.equal(await page.locator('.glossary').getAttribute('open'),'');
 await page.keyboard.press('Escape'); await page.waitForTimeout(100);
 assert.equal(await page.locator('#storySheet').evaluate(e=>e.open),false);
 assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scrollBefore)<3);
 assert.equal(await page.locator('#storyList button[data-story-id]').first().evaluate(e=>e===document.activeElement),true);
 await page.locator('#leadStory [data-story-id]').first().click();
 await page.goBack(); await page.waitForTimeout(100);
 assert.equal(await page.locator('#storySheet').evaluate(e=>e.open),false);
 await page.locator('[data-filter="Patriots"]').click();
 assert.equal(await page.locator('#storyList [data-story-id]').count(),1);
 assert.ok(await page.locator('#leagueWide .quick-hit').count()>0);
 await page.goto('http://127.0.0.1:4175/?date=2026-10-17');
 if(width<560) { await page.locator('.mobile-tabbar [href="#leagueWide"]').click(); await page.waitForFunction(()=>document.querySelector('#leagueWide').getBoundingClientRect().top<200); assert.ok(await page.locator('#leagueWide').evaluate(e=>e.getBoundingClientRect().top<200)); }
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:`docs/screenshots/redesign-review/${width}.png`,fullPage:true});
 console.log(`PASS viewport ${width}: order, dedup, detail, Escape/focus, Back, scoped filter, overflow`);
}
await page.goto('http://127.0.0.1:4175/?date=2026-10-15');
await page.waitForSelector('#storyList button');
assert.equal(await page.locator('#demoNotice').isVisible(),true);
await page.locator('#newerButton').click();
assert.match(page.url(),/2026-10-16/);
assert.deepEqual(errors,[]);
console.log('PASS old edition, date navigation, zero page errors');
} finally {await browser.close();}
