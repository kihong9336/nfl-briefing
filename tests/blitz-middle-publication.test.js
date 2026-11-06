import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {chromium} from 'playwright';
const kind='blitz-protection-middle-catch-run';
for (const width of [320,390]) test(`middle catch/run diagram fits ${width}px with separate labels`,async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(renderTacticDiagram({title:'보호와 가운데 패스',diagram:{kind}}));
  const layout=await page.evaluate(()=>{
   const labels=[...document.querySelectorAll('svg text')].map(e=>e.getBoundingClientRect());
   return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};
  });
  assert.deepEqual(layout,{overflow:false,overlap:false});
 }finally{await browser.close();}
});
test('blitz protection middle catch/run has distinct protection, pass, run and pursuit',()=>{
 const svg=renderTacticDiagram({title:'Washington & protection',diagram:{kind}});
 for(const action of ['protection','pressure','middle-pass','run-after-catch','pursuit']) assert.ok(svg.includes(`data-action="${action}"`),action);
 assert.match(svg,/50야드: 전체 이득/);assert.match(svg,/실제 정렬 재현 아님/);
 assert.match(svg,/Washington &amp; protection/); assert.doesNotMatch(svg,/>RB<|핫 리드|스크린/);
 assert.match(svg,/max-width:100%/);
});
test('publication accepts dedicated blitz middle diagram without timestamp requirement',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false && e.tactics.length));
 const t=structuredClone(e.tactics[0]);
 t.video={title:'전체 경기 하이라이트',type:'NFL 공식 전체 경기',url:'https://www.youtube.com/watch?v=TRUoUtxPZIU'};
 t.diagram={kind,caption:'보호와 패스, 포구 뒤 전진을 설명하는 일반 개념도입니다.'};
 delete t.diagramDesign;e.tactics=[t];assert.doesNotThrow(()=>validateEdition(e));
});
