import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';
const tactic = {title:'RB 플랫 진출과 TE 중앙 패스 창', diagram:{kind:'flat-release-middle-window'}};
test('flat release has three distinct accessible stages and retains deep defender',()=>{
 const html=renderTacticDiagram(tactic);
 assert.equal((html.match(/<svg /g)||[]).length,3);
 for(const key of ['condensed','flat-release','middle-window']) assert.ok(html.includes(`data-panel="${key}"`));
 assert.ok(html.includes('data-action="underneath-widen"'));
 assert.ok(html.includes('data-action="middle-pass"'));
 assert.equal((html.match(/data-role="deep-defender"/g)||[]).length,3);
 assert.ok(html.includes('경합 포구'));
 assert.ok(html.includes('width:100%;max-width:100%;height:auto'));
 assert.ok(!html.includes('다섯 루트'));
 assert.ok(!html.includes('준비 중'));
});
test('publication accepts verified flat-release teaching diagram',()=>{
 const e=structuredClone(briefings.find(e=>e.tactics?.length));
 e.tactics[0].diagram.kind=tactic.diagram.kind;
 assert.doesNotThrow(()=>validateEdition(e));
});
