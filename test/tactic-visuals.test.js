import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTacticDiagram } from '../src/tactic-visuals.js';

test('hook ladder has one forward pass, a backward lateral and a run past the sticks', () => {
  const item = {title: '<Hook>', source: {url: 'https://example.com'}, diagram: {kind: 'hook-and-ladder'}};
  const original = structuredClone(item);
  const svg = renderTacticDiagram(item);
  assert.match(svg, /&lt;Hook&gt;/);
  assert.match(svg, /실제 선수 위치.*아님/);
  assert.match(svg, /전방 패스/);
  assert.match(svg, /후방 래터럴/);
  assert.match(svg, /3rd &amp; 11/);
  assert.match(svg, /data-action="forward-pass"[^>]*d="M360 330 L220 210"/);
  assert.match(svg, /data-action="backward-lateral"[^>]*d="M220 210 L320 245"/);
  assert.match(svg, /data-action="advance"[^>]*d="M320 245 L390 110"/);
  assert.match(svg, /LINE TO GAIN/);
  assert.deepEqual(item, original);
});

test('fourth down DB blitz shows pressure to a sack behind the line without invented protection', () => {
  const svg = renderTacticDiagram({title: 'DB blitz', diagram: {kind: 'fourth-down-db-blitz'}});
  assert.match(svg, /실제 선수 위치.*아님/);
  assert.match(svg, /OT · 4th &amp; 8/);
  assert.match(svg, /LINE TO GAIN/);
  assert.match(svg, /data-action="db-pressure"[^>]*d="M180 220 Q240 300 340 330"/);
  assert.match(svg, /SACK/);
  assert.doesNotMatch(svg, />OL<|>LB<|>C<|Ramsey/);
});

test('blitz diagram shows formation, pressure, hot route, and vacated space', () => {
  const svg = renderTacticDiagram({
    title: '블리츠와 핫 리드',
    diagram: { kind: 'blitz-hot-read', caption: '압박 반대편의 빈 공간' },
  });

  assert.match(svg, /QB/);
  assert.match(svg, /OL/);
  assert.match(svg, /블리츠/);
  assert.match(svg, /핫 리드/);
  assert.match(svg, /비는 공간/);
  assert.match(svg, /marker-end="url\(#arrow-red\)"/);
});

test('back shoulder diagram shows the sideline, defender momentum, and catch point', () => {
  const svg = renderTacticDiagram({
    title: '백숄더 패스',
    diagram: { kind: 'back-shoulder', caption: '수비수의 진행 방향 반대편' },
  });

  assert.match(svg, /사이드라인/);
  assert.match(svg, /CB 진행/);
  assert.match(svg, /캐치 지점/);
  assert.match(svg, /WR 브레이크/);
  assert.match(svg, /QB/);
});
