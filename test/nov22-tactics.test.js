import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
const tactic={...briefings.find(e=>e.tactics.length).tactics[0],title:'오른쪽 태클의 일대일 패스 보호',diagram:{kind:'island-tackle-five-man-protection',caption:'일반 개념도: 실제 경기의 정렬 재현은 아닙니다.'}};
test('five-man protection has three panels, five pairs per panel and a highlighted RT',()=>{
 const html=renderTacticDiagram(tactic);
 assert.equal((html.match(/<svg /g)||[]).length,3);
 assert.equal((html.match(/data-pair=/g)||[]).length,15);
 assert.equal((html.match(/data-position="RT"/g)||[]).length,3);
 for(const action of ['alignment','individual-blocks','quick-release']) assert.ok(html.includes(`data-panel="${action}"`));
 assert.match(html,/data-action="qb-release"/);
 assert.match(html,/공격 ↑/);
 assert.match(html,/width:100%;max-width:100%;height:auto/);
 assert.doesNotMatch(html,/준비 중|RB 추가/);
 assert.equal((html.match(/실제 정렬 재현 아님/g)||[]).length,1);
});
test('new island tackle diagram passes publication validation',()=>{
 const base=briefings.find(e=>e.sample===false && e.tactics.length);
 assert.doesNotThrow(()=>validateEdition({...base,tactics:[tactic]}));
});
