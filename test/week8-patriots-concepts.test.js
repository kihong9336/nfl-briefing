import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
for (const [kind, actions] of [
  ['go-post-go-vs-cover3', ['short-motion','left-go','right-go','deep-post','qb-step-up']],
  ['stunt-protection-exchange', ['penetrator','looper','protection-exchange']]
]) {
  test(`${kind}: accessible responsive concept with distinct actions`, () => {
    const html=renderTacticDiagram({title:'개념 <검증>',diagram:{kind}});
    assert.match(html,/role="img"/);
    assert.match(html,/max-width:100%/);
    assert.match(html,/실제 배치 재현 아님/);
    assert.match(html,/개념 &lt;검증&gt;/);
    assert.doesNotMatch(html,/준비 중|Cashman|[?&]t=/);
    for (const action of actions) assert.ok(html.includes(`data-action="${action}"`));
    if(kind==='go-post-go-vs-cover3') assert.equal((html.match(/data-zone="deep-/g)||[]).length,3);
  });
  test(`${kind}: accepted without weakening other diagram validation`, () => {
    const edition=structuredClone(briefings.find(e=>e.sample===false && e.tactics.length));
    edition.tactics=edition.tactics.slice(0,1);
    edition.tactics[0].diagram={kind,caption:'원리 이해를 위한 일반 개념도이며 실제 정렬 재현이 아니다.'};
    assert.doesNotThrow(()=>validateEdition(edition));
    edition.tactics[0].diagram.kind='not-a-supported-diagram';
    assert.throws(()=>validateEdition(edition),/unsupported/);
  });
}
