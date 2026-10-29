import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { validateEdition } from '../src/publish.js';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { renderIntegratedTactic } from '../src/tactic-reading-flow.js';
const tactic = {id:'rotation-test',team:'NFL',label:'교대와 선택지',title:'두 러닝백이 공유하는 공격 선택지',narrativeMode:'integrated',concept:'교대해도 러닝과 패스의 선택지를 유지한다.',easy:'선수가 바뀌어도 같은 메뉴를 고르는 방식이다.',gameUse:'공식 리캡으로 확인한 경기의 교대 운영을 설명한다.',whyItWorks:'러닝백 이름만으로 공격 종류를 예측하기 어렵다.',defenseCounter:'수비는 갭과 패스 수신자에 대한 책임을 유지한다.',diagram:{kind:'rb-rotation-options',caption:'선택지 관계 개념도이며 실제 정렬 재현은 아니다.'},breakdown:[1,2,3].map(n=>({label:String(n),text:'교대와 공격 선택지, 수비 책임을 함께 읽는다.'})),watchOrder:['교대 인원을 확인한다.','다운과 거리를 확인한다.','수비 책임을 확인한다.'],source:{label:'Rams',url:'https://www.therams.com/'},video:{title:'Rams 구단 주요 장면',type:'구단 공식 주요 장면',url:'https://www.youtube.com/watch?v=BfUbn1BtRpI'}};
test('RB rotation diagram is accepted without weakening unknown-kind validation',()=>{
 const e=structuredClone(briefings[0]); e.tactics=[tactic]; assert.doesNotThrow(()=>validateEdition(e));
 e.tactics[0]={...tactic,diagram:{...tactic.diagram,kind:'invented'}}; assert.throws(()=>validateEdition(e),/unsupported/);
});
test('RB rotation uses responsive native keyboard disclosures, not invented field geometry',()=>{
 const html=renderTacticDiagram(tactic);
 for(const text of ['Williams','Corum','공통 메뉴','러닝','패스','갭','커버']) assert.ok(html.includes(text),text);
 assert.equal((html.match(/<summary>/g)||[]).length,3);
 assert.match(html,/max-width:100%/); assert.match(html,/overflow-wrap:anywhere/);
 assert.doesNotMatch(html,/line-scrimmage|yard-lines|<svg|diagram-fallback/);
 assert.ok(renderTacticDiagram({...tactic,title:'<unsafe>'}).includes('&lt;unsafe&gt;'));
});
test('rotation concept precedes integrated steps and retains the verified video',()=>{
 const html=renderIntegratedTactic(tactic);
 assert.ok(html.includes('BfUbn1BtRpI'));
 assert.ok(html.indexOf('rb-rotation-options')<html.indexOf('플레이가 이렇게 진행돼'));
});
