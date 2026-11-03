import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
for (const [kind, actions] of [
  ['poach-quarters-trips', ['solo-lock','weak-safety-help','flat-out','loop-rush','corner-stop']],
  ['teammate-pass-tip-interception', ['intended-pass','deflection','possession']]
]) {
  test(`${kind}: accessible responsive diagram with distinct responsibilities`, () => {
    const svg=renderTacticDiagram({title:'전술 <검증>',diagram:{kind}});
    assert.match(svg,/role="img"/);
    assert.match(svg,/max-width:100%/);
    assert.match(svg,/실제 정렬 재현 아님/);
    assert.match(svg,/전술 &lt;검증&gt;/);
    assert.doesNotMatch(svg,/diagram-fallback|Hopper|직접 포구/);
    for(const action of actions) assert.ok(svg.includes(`data-action="${action}"`), action);
    if(kind==='poach-quarters-trips') {
      assert.match(svg,/stroke-dasharray/);
      for(const label of ['No.1','No.2','No.3','단독','약측','강측']) assert.ok(svg.includes(label));
    } else {
      assert.match(svg,/Booker/); assert.match(svg,/Lynch/);
    }
  });
  test(`${kind}: validator accepts new kind, rejects unsupported kind`, () => {
    const ed=structuredClone(briefings.find(e=>e.sample===false && e.tactics.length));
    ed.tactics=ed.tactics.slice(0,1);
    ed.tactics[0].diagram={kind,caption:'일반 개념도이며 실제 정렬 재현이 아닙니다.'};
    assert.doesNotThrow(()=>validateEdition(ed));
    ed.tactics[0].diagram.kind='unsupported-nov3';
    assert.throws(()=>validateEdition(ed),/unsupported/);
  });
}
