import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
for (const width of [320,390]) test(`power counter fits ${width}px with contained labels and arrows`,async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent('<style>'+readFileSync(new URL('../styles.css',import.meta.url),'utf8')+'</style>'+renderTacticDiagram({title:'파워에서 바깥으로',diagram:{kind:'power-rush-setup-outside-counter'}}));
  const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('svg text,svg [data-action]')].some(e=>{const a=e.getBoundingClientRect(),b=e.closest('svg').getBoundingClientRect();return a.left<b.left||a.right>b.right||a.top<b.top||a.bottom>b.bottom})}));
  assert.deepEqual(result,{overflow:false,clipped:false});
 }finally{await browser.close();}
});
const tactic={...briefings.find(e=>e.tactics.length)?.tactics[0],title:'힘으로 밀고 바깥으로 전환하는 러시',diagram:{kind:'power-rush-setup-outside-counter',caption:'반복 파워 뒤 안쪽 잽과 바깥 어깨 공략'}};
test('power rush counter has three distinct panels and explicit direction legend',()=>{
 const html=renderTacticDiagram(tactic);
 assert.equal((html.match(/data-panel=/g)||[]).length,3);
 for(const action of ['power-setup','inside-jab','outside-counter','arm-contact']) assert.ok(html.includes(`data-action="${action}"`));
 assert.match(html,/공격: 흰색/);assert.match(html,/수비: 빨강/);
 // The lesson caption supplies the single conceptual-diagram disclaimer.
 assert.doesNotMatch(html,/일반 개념도/);
 assert.doesNotMatch(html,/pocket-compression|iframe|[?&]t=/);
 assert.match(html,/width:100%;max-width:100%;height:auto/);
});
test('publication validator accepts the dedicated power rush counter diagram',()=>{
 const edition=structuredClone(briefings[0]);edition.tactics=[tactic];assert.doesNotThrow(()=>validateEdition(edition));
});
