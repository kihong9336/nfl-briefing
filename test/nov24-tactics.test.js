import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
const base=briefings.find(e=>e.sample===false && e.tactics.length);
const tactic={...base.tactics[0],title:'두 번의 중앙 패스와 스파이크 시간 관리',diagram:{kind:'two-minute-middle-spike',caption:'일반 개념도: 실제 선수 정렬이 아닌 경기 기록 시간선입니다.'}};
test('middle-spike timeline shows both spikes and all game-clock times accessibly',()=>{
 const html=renderTacticDiagram(tactic);
 assert.doesNotMatch(html,/준비 중/);
 for(const time of ['0:39','0:24','0:23','0:05','0:04']) assert.ok(html.includes(time));
 assert.equal((html.match(/data-action="spike"/g)||[]).length,2);
 assert.match(html,/경기 시계/);
 assert.match(html,/실제 선수 정렬/);
 for(const spot of ['WAS28','50','CIN8','22야드','42야드','26야드']) assert.ok(html.includes(spot));
 assert.match(html,/<ol/);
 assert.match(html,/max-width:100%/);
 assert.doesNotMatch(html,/<svg|width:\d+px/);
});
test('middle-spike schema accepts evidence-based clock timeline',()=>{
 assert.doesNotThrow(()=>validateEdition({...base,tactics:[tactic]}));
});
test('middle-spike title is HTML escaped',()=>{
 const html=renderTacticDiagram({...tactic,title:'<script>bad</script>'});
 assert.doesNotMatch(html,/<script>/);
});
