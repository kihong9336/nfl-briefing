import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { validateEdition } from '../src/publish.js';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { renderIntegratedTactic } from '../src/tactic-reading-flow.js';
const tactic = { ...briefings.flatMap(e=>e.tactics)[0], title: '4다운 시간 선택 <검증>', narrativeMode:'integrated', diagram: {kind:'fourth-down-clock-decision',caption:'거리와 시간의 선택을 설명하는 개념도입니다.'}, video:{title:'전체 경기 하이라이트',type:'전체 경기 하이라이트',url:'https://www.youtube.com/watch?v=r3NBIs-ABLA'} };
test('clock decision diagram provides three ordered accessible branches without invented probabilities',()=>{
 const html=renderTacticDiagram(tactic);
 for(const text of ['4Q 4:53','4th &amp; 1','펀트','시도 성공','시도 실패','다음 공격권','상대의 시간 관리']) assert.ok(html.includes(text),text);
 assert.ok(html.includes('&lt;검증&gt;'));
 assert.ok(html.includes('<ol'));
 assert.ok(html.indexOf('펀트') < html.indexOf('시도 성공'));
 assert.ok(html.indexOf('시도 성공') < html.indexOf('시도 실패'));
 assert.ok(!html.includes('diagram-fallback'));
 assert.ok(!/\d+%|[?&]t=\d/.test(html.replace(/style="[^"]*"/g,'')));
 assert.ok(html.includes('overflow-wrap:anywhere'));
 assert.ok(!/min-width:\s*\d+px/.test(html));
});
test('publisher supports the clock decision kind without accepting unknown kinds',()=>{
 const edition=structuredClone(briefings[0]); edition.tactics=[{...structuredClone(tactic),title:'4다운에서 시간과 공격권을 함께 보는 판단'}];
 assert.doesNotThrow(()=>validateEdition(edition));
 edition.tactics[0].diagram.kind='unknown';
 assert.throws(()=>validateEdition(edition),/unsupported/);
});
test('clock teaching flow is full video then diagram then explained steps',()=>{
 const html=renderIntegratedTactic(tactic);
 assert.ok(html.indexOf('film-link')<html.indexOf('clock-decision'));
 assert.ok(html.indexOf('clock-decision')<html.indexOf('play-steps'));
 assert.ok(!/[?&](?:amp;)?t=\d/.test(html));
});
