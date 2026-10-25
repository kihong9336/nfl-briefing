import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
import {readFileSync} from 'node:fs';
import {renderIntegratedTactic} from '../src/tactic-reading-flow.js';

test('staged October 25 lesson validates and labels the optional video as full-game highlights', () => {
  const {tactic, evidence} = JSON.parse(readFileSync(new URL('./fixtures/double-dig.lesson.json', import.meta.url), 'utf8'));
  const edition = structuredClone(briefings.find(x => x.date === '2026-10-25'));
  edition.tactics = [tactic];
  assert.doesNotThrow(() => validateEdition(edition));
  assert.equal(tactic.narrativeMode, 'integrated');
  assert.equal(evidence.gamebookPlay.clock, '4:59');
  assert.equal(evidence.gamebookPlay.yards, 21);
  const html = renderIntegratedTactic(tactic);
  assert.match(html, /전체 경기 하이라이트 — 특정 장면 시점 미지정/);
  assert.doesNotMatch(html, /해당 플레이|이 플레이 영상 보기/);
  assert.match(html, /Lazar/);
  assert.match(html, /수비의 선택/);
});

test('double dig depicts two depths and a middle-zone read, not an invented full alignment', () => {
  const html = renderTacticDiagram({title:'더블 디그 & 가운데 읽기',diagram:{kind:'double-dig-vs-tampa2'}});
  assert.match(html, /<svg/);
  assert.match(html, /data-action="inside-dig"[^>]*d="M230 320 V220 H430"/);
  assert.match(html, /data-action="outside-dig"[^>]*d="M100 320 V140 H430"/);
  assert.match(html, /data-action="middle-zone-read"/);
  assert.match(html, /data-zone="middle"/);
  assert.match(html, /data-zone="deep-left"/);
  assert.match(html, /data-zone="deep-right"/);
  assert.match(html, /실제 배치 재현 아님/);
  assert.match(html, /더블 디그 &amp; 가운데 읽기/);
  assert.equal((html.match(/class="diagram-player/g) ?? []).length, 4);
  const edition = structuredClone(briefings.find(x => x.tactics?.length));
  edition.tactics[0].diagram.kind = 'double-dig-vs-tampa2';
  assert.doesNotThrow(() => validateEdition(edition));
});
