import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
const kind='five-out-vs-pressure-disguise';
test('five-out comparison distinguishes targets, protection, threat and post-snap response',()=>{
 const html=renderTacticDiagram({title:'보호와 루트 선택',diagram:{kind}});
 for(const text of ['일반 개념도','표적 3명','표적 5명','RB·TE 보호','RB·TE 루트','pressure-threat','actual-rush','coverage-drop']) assert.ok(html.includes(text),text);
 assert.ok(html.includes('min(100%,260px)'));
 assert.equal((html.match(/viewBox="0 0 320 360"/g)||[]).length,2);
});
test('publication accepts dedicated five-out diagram without relaxing other validation',()=>{
 const edition=structuredClone(briefings.find(e=>e.tactics.length));
 edition.tactics[0].diagram.kind=kind;
 assert.doesNotThrow(()=>validateEdition(edition));
 edition.tactics[0].diagram.kind='unverified-kind';
 assert.throws(()=>validateEdition(edition),/unsupported/);
});
