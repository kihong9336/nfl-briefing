import test from 'node:test';
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
const tactic=structuredClone(briefings.find(e=>e.sample===false && e.tactics.length).tactics[0]);
tactic.diagram={kind:'coordinated-pocket-compression',caption:'양쪽과 내부 압박을 함께 보여주는 일반 개념도다.'};
test('pocket compression renders three accessible phases without a fabricated timestamp',()=>{
 const html=renderTacticDiagram(tactic);
 assert.match(html,/data-action="edge-compression"/);
 assert.match(html,/data-action="interior-push"/);
 assert.match(html,/data-action="finish"/);
 assert.equal((html.match(/<summary>/g)||[]).length,3);
 assert.match(html,/실제 배치 재현 아님/);
 assert.match(html,/max-width:100%/);
 assert.doesNotMatch(html,/준비 중|[?&]t=/);
});
test('publication accepts the verified coordinated pocket compression concept',()=>{
 const edition=structuredClone(briefings.find(e=>e.sample===false));
 edition.tactics=[tactic];
 assert.doesNotThrow(()=>validateEdition(edition));
});
