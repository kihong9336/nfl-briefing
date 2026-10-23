import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
test('catch-and-run schematic shows short pass, blocker and running lane without inventing full alignment',()=>{
 const html=renderTacticDiagram({title:'짧은 패스 이후 전진',diagram:{kind:'catch-and-run'}});
 assert.match(html,/<svg/);assert.match(html,/data-action="short-pass"/);assert.match(html,/data-action="downfield-block"/);assert.match(html,/data-action="run-after-catch"/);assert.match(html,/개념도/);assert.doesNotMatch(html,/준비 중/);
 const edition=structuredClone(briefings.find(x=>x.tactics?.length));edition.tactics[0].diagram.kind='catch-and-run';assert.doesNotThrow(()=>validateEdition(edition));
});
