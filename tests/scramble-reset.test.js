import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
const tactic={id:'scramble-example',team:'49ers',label:'전술 교실',title:'Purdy의 이동과 멈춤 이후 McCaffrey의 전진',concept:'압박 뒤에도 표적을 찾는 스크램블 드릴 개념이다.',easy:'쿼터백은 달리면서도 열린 동료를 찾아 패스한다.',gameUse:'Purdy와 McCaffrey의 74야드 터치다운 사례다.',whyItWorks:'시간 확보와 열린 표적, 캐치 이후 블록이 연결된다.',defenseCounter:'수비는 쿼터백 추격과 패스 표적 추적을 나눈다.',diagram:{kind:'scramble-reset-catch-run',caption:'일반 역할 개념도이며 실제 좌표를 재현한 그림이 아니다.'},breakdown:[1,2,3].map(i=>({label:String(i),text:'실제 경기 리캡을 근거로 단계별 원리를 설명한다.'})),watchOrder:['쿼터백 오른쪽 이동','열린 표적에게 패스','전방 블록 이후 전진'],source:{label:'49ers',url:'https://www.49ers.com/'}};
test('scramble reset has three ordered panels and correct roles',()=>{const html=renderTacticDiagram(tactic); assert.equal((html.match(/<svg /g)||[]).length,3); for(const x of ['Purdy','McCaffrey','Kittle','Watkins','qb-escape','reset-pass','catch-run'])assert.ok(html.includes(x),x);assert.ok(html.indexOf('qb-escape')<html.indexOf('reset-pass'));assert.ok(html.indexOf('reset-pass')<html.indexOf('catch-run'));assert.doesNotMatch(html,/Latu|Chism/);});
test('publication accepts supported scramble reset draft',()=>{const e=structuredClone(briefings.find(e=>e.sample===false));e.tactics=[tactic];assert.doesNotThrow(()=>validateEdition(e));});
