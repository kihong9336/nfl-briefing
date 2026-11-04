import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';

test('split zone: accessible responsive diagram separates zone, sift and cutback', () => {
  const svg=renderTacticDiagram({title:'Split <zone>',diagram:{kind:'split-zone-cutback'}});
  assert.match(svg,/role="img"/);
  assert.match(svg,/aria-labelledby="split-title split-desc"/);
  assert.match(svg,/max-width:100%;height:auto/);
  assert.match(svg,/Split &lt;zone&gt;/);
  assert.match(svg,/실제 정렬 재현 아님/);
  for(const action of ['zone-right','sift-left','edge-contact','rb-cutback']) assert.ok(svg.includes(`data-action="${action}"`));
  assert.match(svg,/M270 220H450/);
  assert.match(svg,/M455 280Q340 310 175 245/);
  assert.doesNotMatch(svg,/diagram-fallback|Kiner|Campbell/);
  for(const label of ['OL','QB','RB','TE','DE','LB']) assert.ok(svg.includes(`>${label}</text>`));
});

test('split zone: validator accepts supported kind and rejects unknown kind', () => {
  const ed=structuredClone(briefings.find(e=>e.sample===false && e.tactics.length));
  ed.tactics=ed.tactics.slice(0,1);
  ed.tactics[0].diagram={kind:'split-zone-cutback',caption:'일반 개념도이며 실제 정렬 재현이 아닙니다.'};
  assert.doesNotThrow(()=>validateEdition(ed));
  ed.tactics[0].diagram.kind='unknown-split';
  assert.throws(()=>validateEdition(ed),/unsupported/);
});
