import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';

test('pass tip diagram distinguishes intended pass, deflection and possession without invented alignment', () => {
  const svg = renderTacticDiagram({title:'<Hopper>',diagram:{kind:'pass-tip-interception'}});
  assert.match(svg, /&lt;Hopper&gt;/);
  for (const token of ['intended-pass','deflection','possession','QB','Hopper','LINE OF SCRIMMAGE','실제 정렬 재현 아님','다음 공격']) assert.ok(svg.includes(token), token);
  assert.match(svg, /stroke-dasharray/);
  assert.doesNotMatch(svg, /SACK|pick-six|diagram-fallback/);
});

test('edition validator supports sourced pass-tip-interception manuscript', () => {
  const edition = structuredClone(briefings.find(e=>e.tactics?.length));
  edition.tactics[0].diagram.kind = 'pass-tip-interception';
  assert.doesNotThrow(()=>validateEdition(edition));
});
