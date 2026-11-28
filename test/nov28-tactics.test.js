import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTacticDiagram } from '../src/tactic-visuals.js';
import { validateEdition } from '../src/publish.js';
import { briefings } from '../src/data.js';
const kind = 'two-edge-pressure-fumble-recovery';
test('two-edge pressure separates down-distance, pressure and recovery without assigning forced fumble', () => {
 const html=renderTacticDiagram({title:'두 방향 압박과 엔드존 회수',diagram:{kind}});
 for (const token of ['3rd &amp; 15','Watt','Herbig','Nix','data-action="two-edge-pressure"','data-action="loose-ball"','data-action="endzone-recovery"','일반 개념도','실제 좌표 재현 아님','width:100%;max-width:100%;height:auto']) assert.ok(html.includes(token),token);
 assert.ok(html.indexOf('<svg') < html.indexOf('<ol'));
 for (const name of ['Van Ness','Sorrell','Wyatt','강제 펌블: Watt','준비 중']) assert.ok(!html.includes(name));
});
test('publication accepts two-edge pressure diagram and continues rejecting unknown kinds', () => {
 const e=structuredClone(briefings.find(e=>e.tactics?.length));
 e.tactics[0].diagram.kind=kind;
 assert.doesNotThrow(()=>validateEdition(e));
 e.tactics[0].diagram.kind='unverified-new-kind';
 assert.throws(()=>validateEdition(e),/unsupported/);
});
