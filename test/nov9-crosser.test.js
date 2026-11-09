import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
const kind='quarters-backside-crosser-jump';
for (const width of [320,390]) test(`backside crosser fits ${width}px without clipped SVG text`,async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(`<style>${readFileSync(new URL('../styles.css',import.meta.url),'utf8')}</style>${renderTacticDiagram({title:'크로서',diagram:{kind}})}`);
  const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth, clipped:[...document.querySelectorAll('svg text')].filter(t=>{const b=t.getBoundingClientRect(),v=t.ownerSVGElement.getBoundingClientRect();return b.left<v.left-1||b.top<v.top-1||b.right>v.right+1||b.bottom>v.bottom+1;}).map(t=>t.textContent)}));
  assert.equal(result.overflow,false); assert.deepEqual(result.clipped,[]);
 } finally {await browser.close();}
});
test('backside crosser: three responsive panels distinguish responsibilities without invented rush',()=>{
 const html=renderTacticDiagram({title:'크로서 <검증>',diagram:{kind}});
 assert.equal((html.match(/role="img"/g)||[]).length,3);
 for(const action of ['solo-lock','backside-crosser','zone-clear','late-pass','safety-jump']) assert.ok(html.includes(`data-action="${action}"`),action);
 for(const label of ['Raridon','Williams','McKinney','실제 좌표 재현 아님','노랑 실선','흰 점선','빨강 점선']) assert.ok(html.includes(label),label);
 assert.match(html,/크로서 &lt;검증&gt;/);
 assert.match(html,/width:100%;max-width:100%/);
 assert.doesNotMatch(html,/loop-rush|corner-stop|diagram-fallback/);
});
test('backside crosser: publication validator supports reviewed diagram',()=>{
 const e=structuredClone(briefings.find(e=>e.sample===false&&e.tactics.length));
 e.tactics[0].diagram.kind=kind;
 assert.doesNotThrow(()=>validateEdition(e));
 e.tactics[0].diagram.kind='not-supported';
 assert.throws(()=>validateEdition(e),/unsupported/);
});
