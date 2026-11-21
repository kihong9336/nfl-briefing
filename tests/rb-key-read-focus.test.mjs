import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';
const tactic = { title:'러닝백 읽기 초점의 일반 개념도', diagram:{kind:'rb-key-read-focus',caption:'일반 개념도이며 실제 경기 배치 재현이 아니다.'}};
test('rb key focus renders three native keyboard controls and abstract nodes',()=>{
 const html=renderTacticDiagram(tactic);
 assert.equal((html.match(/<summary/g)||[]).length,3);
 assert.match(html,/일반 개념도/); assert.match(html,/data-action="read-key"/);
 assert.doesNotMatch(html,/diagram-fallback/);
});
test('rb key focus is accepted by edition validation',()=>{
 const e=structuredClone(briefings.find(e=>e.tactics?.length && !e.sample));
 e.tactics[0].diagram=tactic.diagram;
 assert.doesNotThrow(()=>validateEdition(e));
});
test('rb key focus fits mobile and supports keyboard activation',async()=>{
 const browser=await chromium.launch({headless:true});
 try {for(const width of [320,390]) {
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.setContent(renderTacticDiagram(tactic));
 assert.equal(await page.locator('summary').count(),3);
 for(let i=0;i<3;i++) {const s=page.locator('summary').nth(i);await s.focus(); const before=await s.evaluate(el=>el.parentElement.open); await page.keyboard.press('Enter');assert.equal(await s.evaluate(el=>el.parentElement.open),!before);}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await page.close();
 }} finally {await browser.close();}
});
