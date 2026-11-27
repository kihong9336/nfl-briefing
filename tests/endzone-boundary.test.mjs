import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';
const tactic={title:'엔드존 경계선 캐치와 착지 공간',diagram:{kind:'endzone-boundary-catch',caption:'관계 개념도이며 실제 전체 배치 재현이 아닙니다.'}};
test('boundary catch has distinct catch and landing regions without invented video timestamp',()=>{
 const html=renderTacticDiagram(tactic);
 for(const token of ['data-action="receiver-direction"','data-action="defender-pressure"','data-region="catch"','data-region="inbounds-landing"','실제 전체 배치 재현 아님','시작 9초','득점 뒤 3초']) assert.ok(html.includes(token),token);
 assert.doesNotMatch(html,/diagram-fallback|[?&]t=|start=/);
});
test('boundary diagram passes publication validation',()=>{
 const e=structuredClone(briefings.find(e=>e.tactics?.length&&!e.sample));e.tactics[0].diagram=tactic.diagram;assert.doesNotThrow(()=>validateEdition(e));
});
test('boundary diagram fits 390px mobile viewport',async()=>{
 const browser=await chromium.launch({headless:true});
 try {const page=await browser.newPage({viewport:{width:390,height:844}});await page.setContent(renderTacticDiagram(tactic));assert.equal(await page.locator('svg').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}finally{await browser.close();}
});
