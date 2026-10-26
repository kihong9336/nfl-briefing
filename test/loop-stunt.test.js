import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { validateEdition } from '../src/publish.js';
import { renderTacticDiagram } from '../src/tactic-visuals.js';

const tactic = {title: '<Cashman>', diagram: {kind: 'loop-stunt'}};
test('loop pressure shows initial RT approach then the opposite LT-LG gap without inventing a full front', () => {
  const svg = renderTacticDiagram(tactic);
  assert.match(svg, /&lt;Cashman&gt;/);
  assert.match(svg, /data-action="initial-approach"/);
  assert.match(svg, /data-action="loop-pressure"/);
  assert.match(svg, /data-zone="protection-handoff"/);
  for (const label of ['LT','LG','C','RG','RT','QB']) assert.ok(svg.includes(`>${label}<`));
  assert.match(svg, /개념도/);
  assert.match(svg, /공격 방향 ↑/);
  assert.doesNotMatch(svg, /diagram-fallback/);
});
test('publication explicitly accepts loop-stunt while rejecting unrelated unknown diagrams', () => {
  const edition = structuredClone(briefings.find(x => x.sample === false && x.tactics.length));
  edition.tactics[0].diagram.kind = 'loop-stunt';
  assert.doesNotThrow(() => validateEdition(edition));
  edition.tactics[0].diagram.kind = 'unknown-loop';
  assert.throws(() => validateEdition(edition), /unsupported/);
});
