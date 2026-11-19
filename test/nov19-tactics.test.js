import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';

for (const [kind, actions, labels] of [
  ['cowboys-coordinated-pocket-compression', ['edge-contain','interior-finish','shared-sack'], ['Winters','Downs','Ogbonnia','Houston','Purdy']],
  ['reverse-misdirection-lead-block', ['right-pitch','reverse-transfer','lead-block'], ['Juszczyk','Black','Deebo','Watkins','Williams','Purdy']]
]) {
  test(kind + ' renders distinct sequential mobile diagrams and validates', () => {
    const base = briefings.find(e => e.sample === false && e.tactics.length);
    const tactic = {...base.tactics[0], title:'검증된 전술 개념 설명', diagram:{kind,caption:'일반 개념도이며 실제 경기 좌표 재현이 아니다.'}};
    const html = renderTacticDiagram(tactic);
    for (const action of actions) assert.ok(html.includes('data-action="'+action+'"'));
    for (const label of labels) assert.ok(html.includes(label));
    assert.equal((html.match(/<svg /g)||[]).length,3);
    assert.match(html,/minmax\(min\(100%,260px\),1fr\)/);
    assert.match(html,/width:100%;max-width:100%;height:auto/);
    assert.doesNotMatch(html,/Parsons|Gary|Love|준비 중/);
    assert.doesNotThrow(()=>validateEdition({...base,tactics:[tactic]}));
  });
}
test('existing Packers pocket compression remains unchanged',()=>{
  const html=renderTacticDiagram({title:'기존 도식',diagram:{kind:'coordinated-pocket-compression'}});
  assert.match(html,/<svg/);
  assert.doesNotMatch(html,/Winters|Ogbonnia|Deebo/);
});
