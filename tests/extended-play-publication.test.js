import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {chromium} from 'playwright';
const kind='extended-play-open-target';
const item={title:'Allen & Latu',diagram:{kind}};
test('extended play shows only supported movement and open target with accessible labels',()=>{
 const html=renderTacticDiagram(item);
 for(const action of ['qb-right','sustained-protection','open-target','td-pass']) assert.ok(html.includes(`data-action="${action}"`),action);
 assert.match(html,/<title[^>]*>Allen &amp; Latu/); assert.match(html,/<desc /);
 assert.match(html,/aria-labelledby/); assert.match(html,/Latu/);
 assert.doesNotMatch(html,/Chism|6\.07|준비 중/);
});
test('publication accepts extended play with full highlight and no invented timestamp',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false&&e.tactics.length));
 e.tactics[0].diagram={kind,caption:'QB 이동과 보호, 열린 표적의 관계를 설명하는 일반 개념도입니다.'};
 e.tactics[0].video={title:'Bills–Vikings 전체 경기 하이라이트',type:'전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=2_ruHrqYSI4'};
 assert.doesNotThrow(()=>validateEdition(e));
});
for(const width of [320,390]) test(`extended play fits ${width}px with no label overlap`,async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(renderTacticDiagram(item));
  assert.equal(await page.locator('svg').count(),1);
  const layout=await page.evaluate(()=>{
   const labels=[...document.querySelectorAll('svg text')].map(e=>e.getBoundingClientRect());
   return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};
  }); assert.deepEqual(layout,{overflow:false,overlap:false});
 } finally {await browser.close();}
});
