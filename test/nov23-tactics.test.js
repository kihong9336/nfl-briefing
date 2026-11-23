import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
const base=briefings.find(e=>e.sample===false && e.tactics.length);
const tactic={...base.tactics[0],title:'Kelce의 이중 동작과 중앙 패스 연결',diagram:{kind:'stick-nod-zone-window',caption:'일반 개념도: 실제 정렬과 거리의 재현은 아닙니다.'},video:{title:'Cardinals–Chiefs 전체 경기',type:'전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=WwsNx--B79g'}};
test('stick nod renders ordered accessible panels and distinguishes route, reaction and pass',()=>{
 const html=renderTacticDiagram(tactic);
 assert.equal((html.match(/<svg /g)||[]).length,3);
 const actions=['outside-fake','defender-reaction','middle-return'];
 let previous=-1;
 for(const action of actions){const index=html.indexOf(`data-action="${action}"`);assert.ok(index>previous);previous=index;}
 assert.match(html,/data-action="qb-pass"/);
 assert.equal((html.match(/role="img" aria-label=/g)||[]).length,3);
 assert.match(html,/width:100%;max-width:100%;height:auto/);
 assert.doesNotMatch(html,/준비 중|back-shoulder/);
 assert.match(html,/실제 정렬 재현 아님/);
});
test('stick nod is accepted without a fabricated video timestamp',()=>{
 assert.doesNotThrow(()=>validateEdition({...base,tactics:[tactic]}));
 assert.equal(new URL(tactic.video.url).searchParams.has('t'),false);
 assert.equal(tactic.video.type,'전체 경기 하이라이트');
});
