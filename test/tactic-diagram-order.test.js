import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIntegratedTactic } from '../src/tactic-reading-flow.js';
import { briefings } from '../src/data.js';
test('integrated lesson presents video, then diagram, then step-by-step explanation', () => {
  const lessons = briefings.find(x => x.date === '2026-10-20').tactics;
  for (const item of lessons) {
    const html = renderIntegratedTactic(item);
    assert.ok(html.indexOf('class="film-link"') < html.indexOf('class="tactic-figure"'));
    assert.ok(html.indexOf('class="tactic-figure"') < html.indexOf('class="play-steps"'));
  }
});
