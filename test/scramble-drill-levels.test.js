import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { renderIntegratedTactic } from '../src/tactic-reading-flow.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';

const tactic = {
  id:'scramble-test', team:'Patriots', label:'실전 전술 · 스크램블 드릴',
  title:'압박을 벗어난 뒤 리시버와 함께 만드는 새 패스 공간',
  concept:'스크램블 드릴은 원래 경로가 끊어진 뒤 새 패스 창을 만드는 약속이다.',
  easy:'쿼터백과 같은 방향으로 움직이며 서로 다른 깊이에서 출구를 만든다.',
  gameUse:'구단 기자는 Maye가 오른쪽으로 이동한 뒤 Chism에게 연결한 장면을 분석했다.',
  whyItWorks:'쿼터백 이동에 따라 패스 각도가 바뀌고 리시버의 새 움직임이 출구를 만든다.',
  defenseCounter:'수비는 쿼터백을 바라보면서도 리시버의 두 번째 움직임을 추적해야 한다.',
  breakdown:[1,2,3,4].map(n=>({label:`단계 ${n}`,text:'리시버의 방향 변화와 쿼터백의 새 패스 각도를 함께 관찰한다.'})),
  watchOrder:['자유 러셔 확인하기','쿼터백 이동 확인하기','리시버 깊이 나누기'],
  diagram:{kind:'scramble-drill-levels',caption:'쿼터백 이동과 서로 다른 깊이의 표적을 설명하는 개념도다.'},
  video:{title:'Patriots–Bears 전체 경기 하이라이트',type:'구단 공식 · 전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=MY9cWucyTMo'},
  source:{label:'Patriots 구단 분석',url:'https://www.patriots.com/news/the-art-of-the-scramble-drill-how-the-patriots-capitalize-on-qb-drake-maye-s-superpower'}
};

test('scramble diagram shows QB movement, free pressure, receiver reversal and three depths',()=>{
  const before=structuredClone(tactic);
  const svg=renderTacticDiagram({...tactic,title:'<Maye & Chism>'});
  assert.match(svg, /viewBox="0 0 720 430"/);
  assert.match(svg, /&lt;Maye &amp; Chism&gt;/);
  for(const action of ['qb-rollout','free-rusher','receiver-return']) assert.ok(svg.includes(`data-action="${action}"`));
  for(const depth of ['deep','middle','short']) assert.ok(svg.includes(`data-depth="${depth}"`));
  assert.match(svg,/LINE OF SCRIMMAGE/);
  assert.match(svg,/Chism/);
  assert.match(svg,/개념도/);
  assert.doesNotMatch(svg,/diagram-fallback/);
  assert.deepEqual(tactic,before);
});

test('scramble publication accepts the dedicated diagram and preserves untimed video before diagram before steps',()=>{
  const edition=structuredClone(briefings.find(e=>e.sample===false));
  edition.tactics=[tactic];
  assert.doesNotThrow(()=>validateEdition(edition));
  const html=renderIntegratedTactic(tactic);
  assert.ok(html.indexOf('film-link')<html.indexOf('tactic-figure'));
  assert.ok(html.indexOf('tactic-figure')<html.indexOf('play-steps'));
  assert.doesNotMatch(html,/[?&](?:amp;)?t=/);
});
