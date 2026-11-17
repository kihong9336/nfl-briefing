import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
for (const [kind,names,actions] of [
  ['teammate-deflection-secure',['Brissett','Lane','Hart','Phillips'],['intended-pass','deflection','secure']],
  ['bunch-flat-pursuit',['Williams','St. Brown','Gonzalez'],['bunch-release','flat-catch','pursuit']]
]) {
  test(kind+' renders correct personnel and three distinct phases',()=>{
    const item=structuredClone(briefings.find(e=>e.tactics.length).tactics[0]);
    item.diagram.kind=kind;
    const e=structuredClone(briefings.find(e=>e.sample===false)); e.tactics=[item];
    assert.doesNotThrow(()=>validateEdition(e));
    const html=renderTacticDiagram(item);
    for(const name of names) assert.ok(html.includes(name),name);
    for(const action of actions) assert.ok(html.includes('data-action="'+action+'"'),action);
    assert.doesNotMatch(html,/Booker|Lynch|Darnold|Barner|준비 중/);
    assert.match(html,/width:100%;max-width:100%/);
    assert.match(html,/일반 개념도/);
    assert.match(html,/공격 ↑/);
    assert.doesNotMatch(html,/[?&]t=/);
    if(kind==='teammate-deflection-secure') assert.match(html,/stroke-dasharray/);
    else assert.doesNotMatch(html,/>RB</);
  });
}
