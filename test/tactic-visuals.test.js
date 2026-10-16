import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTacticDiagram } from '../src/tactic-visuals.js';

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
