import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {chromium} from 'playwright';
const kind='te-middle-catch-run';
const item={title:'Kelce & 중앙 패스',diagram:{kind}};
test('TE middle catch separates pass, catch and advance without invented blockers',()=>{
 const html=renderTacticDiagram(item);
 for(const action of ['middle-pass','te-catch','run-after-catch']) assert.ok(html.includes(`data-action="${action}"`),action);
 assert.match(html,/>TE<|>TE<\/text>/);
 assert.match(html,/<title[^>]*>Kelce &amp;/);
 assert.match(html,/<desc /); assert.match(html,/aria-labelledby/);
 assert.match(html,/stroke-dasharray/);
 assert.doesNotMatch(html,/준비 중|>WR<|>RB<|downfield-block|엔드존/);
 assert.ok(html.indexOf('①')<html.indexOf('②') && html.indexOf('②')<html.indexOf('③'));
});
test('publication accepts TE catch and run with full highlight without timestamp',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false&&e.tactics.length));
 e.tactics[0].diagram={kind,caption:'중앙 패스와 포구 뒤 전진을 구분한 일반 개념도입니다.'};
 e.tactics[0].video={title:'Jets–Chiefs 전체 경기 하이라이트',type:'전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=wlsz9L78_o8'};
 assert.doesNotThrow(()=>validateEdition(e));
});
for(const width of [320,390]) test(`TE middle diagram fits ${width}px without label overlap`,async()=>{
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
