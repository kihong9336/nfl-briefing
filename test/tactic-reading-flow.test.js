import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateStaticPages } from '../src/static-pages.js';
import { renderIntegratedTactic } from '../src/tactic-reading-flow.js';
import { escapeHtml, safeHttpsUrl } from '../src/render-utils.js';
import { renderTacticDiagram } from '../src/tactic-visuals.js';

const item = { narrativeMode: 'integrated', title: 'Play', label: 'Film', concept: 'Unique concept', easy: 'Unique analogy', whyItWorks: 'Legacy principle', defenseCounter: 'Legacy counter', gameUse: 'Watch the receiver', breakdown: [{ label: 'Catch', text: 'Stage action', meaning: '<principle>', counter: '<counter>' }], video: { url: 'https://www.youtube.com/watch?v=abc&t=12s', title: 'Individual play', type: 'Play clip' }, source: { label: 'Official source', url: 'https://example.com/source' } };
function staticCard(card) {
 return generateStaticPages([{ date: '2026-10-20', lead: { title: 'Edition', summary: 'Summary' }, tactics: [card] }])['editions/2026-10-20/index.html'];
}
function checkFlow(html) {
 assert.ok(html.includes('장면 이해하기'));
 assert.ok(html.includes('플레이가 이렇게 진행돼'));
 assert.ok(html.includes('이 장면의 원리'));
 assert.ok(html.includes('수비의 선택'));
 assert.ok(html.includes('&lt;principle&gt;'));
 assert.ok(html.includes('&lt;counter&gt;'));
 assert.ok(!html.includes('<principle>'));
 assert.equal(html.split('Unique concept').length - 1, 1);
 assert.equal(html.split('Unique analogy').length - 1, 1);
 assert.ok(!html.includes('전술 개념'));
 assert.ok(!html.includes('쉽게 말하면'));
 assert.ok(html.indexOf('Individual play') < html.indexOf('플레이가 이렇게 진행돼'));
 assert.ok(html.indexOf('Individual play') < html.indexOf('tactic-figure'));
 assert.ok(html.includes('t=12s'));
 assert.ok(html.includes('Official source'));
 assert.ok(html.includes('Legacy principle'));
 assert.ok(html.includes('Legacy counter'));
 assert.equal(html.split('개념도는 실제 정렬 재현이 아닙니다.').length - 1, 1);
}
test('static integrated tactics tell one escaped story with video first', () => checkFlow(staticCard(item)));
function appCard(card) {
 const code = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
 const section = {};
 const context = { $: () => section, h: escapeHtml, safeHttpsUrl, renderTacticDiagram, renderIntegratedTactic, plainTitle: text => text, shortExtract: text => text };
 vm.runInNewContext(code.slice(code.indexOf('function renderTactics('), code.indexOf('function renderHighlights(')) + '\nthis.renderTactics = renderTactics;', context);
 context.renderTactics({ tactics: [card] });
 return section.innerHTML;
}
test('interactive tactics use the same integrated reading flow', () => checkFlow(appCard(item)));
test('integrated cards retain supporting captions and game-use prose in collapsed references', () => {
 const html = renderIntegratedTactic({ ...item, gameUse: 'Full game-use context', watchOrder: ['Short watch cue'], diagram: { caption: 'Supporting caption' } });
 assert.ok(html.includes('Full game-use context'));
 assert.ok(html.includes('Supporting caption'));
 assert.match(html, /<details class="tactic-reference">/);
});
test('default legacy rendering retains its original teaching blocks', () => {
 const { narrativeMode, ...legacy } = item;
 const html = appCard(legacy);
 for (const label of ['전술 개념', '쉽게 말하면', '왜 통하는가', '수비의 대응']) assert.ok(html.includes(label));
 assert.ok(html.indexOf('tactic-figure') < html.indexOf('Individual play'));
 assert.ok(!html.includes('장면 이해하기'));
 const archive = staticCard(legacy);
 assert.ok(archive.includes('작동 원리'));
 assert.ok(archive.includes('수비의 대응'));
 assert.ok(!archive.includes('data-narrative-mode'));
});
