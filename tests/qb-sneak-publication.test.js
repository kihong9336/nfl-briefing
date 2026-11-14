import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {chromium} from 'playwright';
const kind='qb-sneak-assignment-vs-push';
const item={title:'QB & 역할 구분',diagram:{kind}};
test('sneak diagram distinguishes third down, optional support and reviewed outcome',()=>{
 const html=renderTacticDiagram(item);
 for(const action of ['qb-advance','line-block','optional-support']) assert.ok(html.includes(`data-action="${action}"`));
 assert.match(html,/3rd &amp; 1/); assert.match(html,/0야드/); assert.match(html,/4th &amp; 1/);
 assert.match(html,/미는 임무가 아니/); assert.match(html,/실제 정렬/); assert.match(html,/QB &amp;/);
 assert.doesNotMatch(html,/준비 중|timestamp|[?&]t=/);
});
test('publication accepts sneak assignment diagram and full-game link',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false&&e.tactics.length));
 e.tactics[0].diagram={kind,caption:'QB 전진과 후방 지원을 구분하는 일반 개념도입니다.'};
 e.tactics[0].video={title:'Commanders–Giants 전체 경기 하이라이트',type:'전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=7UsUSgeGEqo'};
 assert.doesNotThrow(()=>validateEdition(e));
});
for(const width of [320,390]) test(`sneak diagram fits ${width}px and supports keyboard details`,async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.setContent(renderTacticDiagram(item));
 assert.equal(await page.locator('svg').count(),1);
 const layout=await page.evaluate(()=>{
 const labels=[...document.querySelectorAll('svg text')].map(e=>e.getBoundingClientRect());
 return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};
 }); assert.deepEqual(layout,{overflow:false,overlap:false});
 await page.locator('summary').focus(); await page.keyboard.press('Enter');
 assert.equal(await page.locator('details').evaluate(e=>e.open),true);
 } finally {await browser.close();}
});
