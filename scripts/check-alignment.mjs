import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
const base = process.env.BASE_URL || 'http://localhost:4173/';
try {
 for (const width of [320,375,390,1280]) {
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#leagueWide .quick-hit');
  const positions=await page.evaluate(()=>{
   const s=document.querySelector('#leagueWide');
   return [...s.querySelectorAll('h2,.story-label,.story-card-button>span:first-child,.story-card-button h3,.story-takeaway,.card-action,.quick-hit>a')].map(e=>({label:e.textContent.slice(0,35),x:e.getBoundingClientRect().x}));
  });
  console.log(width,JSON.stringify(positions));
  for(const p of positions) assert.ok(Math.abs(p.x-positions[0].x)<1,`${width}px: ${p.label} x=${p.x}, expected ${positions[0].x}`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#leagueWide .story-card-button').first().click();
  assert.ok(await page.locator('#storySheet').evaluate(e=>e.open));
  await page.locator('#storySheetClose').click();
  await page.waitForFunction(()=>!document.querySelector('#storySheet').open);
  await page.locator('#leagueWide').scrollIntoViewIfNeeded();
  await page.screenshot({path:`/tmp/nfl-alignment-${width}.png`});
  assert.deepEqual(errors,[]);await page.close();
 }
} finally {await browser.close();}
