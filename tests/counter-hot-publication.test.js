import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {chromium} from 'playwright';
const kind='counter-hot-play-action';
const item={title:'Counter & hot',diagram:{kind}};
test('counter hot separates pull, fake, protection, crossing and pass',()=>{
 const html=renderTacticDiagram(item);
 for(const action of ['guard-pull','run-fake','pass-protection','lb-reaction','te-cross','qb-pass']) assert.ok(html.includes(`data-action="${action}"`),action);
 assert.match(html,/실제 정렬 재현 아님/);assert.match(html,/Counter &amp; hot/);
 assert.match(html,/stroke-dasharray/);assert.doesNotMatch(html,/준비 중/);
});
test('publication accepts counter hot with untimed full highlight',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false&&e.tactics.length));
 e.tactics[0].diagram={kind,caption:'가드 풀과 TE 크로싱의 관계를 설명하는 일반 개념도입니다.'};
 e.tactics[0].video={title:'전체 경기 하이라이트',type:'NFL 공식 전체 경기',url:'https://www.youtube.com/watch?v=usw9WiShXEs'};
 assert.doesNotThrow(()=>validateEdition(e));
});
for(const width of [320,390]) test(`counter hot fits ${width}px and toggles without duplicating players`,async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(renderTacticDiagram(item));
  const count=await page.locator('.diagram-player').count(); assert.ok(count>0);
  for(const summary of await page.locator('summary').all()){await summary.click();await summary.click();}
  assert.equal(await page.locator('.diagram-player').count(),count);
  const layout=await page.evaluate(()=>{
   const labels=[...document.querySelectorAll('svg text')].map(e=>e.getBoundingClientRect());
   return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};
  });assert.deepEqual(layout,{overflow:false,overlap:false});
 }finally{await browser.close();}
});
