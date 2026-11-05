import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { validateEdition } from '../src/publish.js';
import { renderTacticDiagram } from '../src/tactic-visuals.js';

import { chromium } from 'playwright';
const kind = 'pass-protection-responsibility';
for (const width of [320,390]) test(`protection diagram fits ${width}px without overlapping labels`, async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width,height:900}});
    await page.setContent(renderTacticDiagram({title:'패스 보호 책임',diagram:{kind}}));
    const layout = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('svg text')].map(e=>e.getBoundingClientRect());
      return {overflow:document.documentElement.scrollWidth > innerWidth, overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top))};
    });
    assert.deepEqual(layout,{overflow:false,overlap:false});
  } finally {await browser.close();}
});
test('protection responsibilities: registered diagram validates', () => {
  const edition = structuredClone(briefings.find(e => e.tactics.length));
  edition.tactics[0].diagram.kind = kind;
  assert.doesNotThrow(() => validateEdition(edition));
});
test('protection responsibilities: separate pressure, block and QB decision paths', () => {
  const html = renderTacticDiagram({title:'보호 <책임>',diagram:{kind}});
  assert.ok(!html.includes('diagram-fallback'));
  for (const action of ['interior-pressure','rb-pressure','qb-decision','rb-block']) assert.ok(html.includes(`data-action="${action}"`));
  for (const label of ['OL 일대일','RB 추가 러셔','QB 공 처리','실제 정렬 재현 아님']) assert.ok(html.includes(label));
  assert.ok(html.includes('보호 &lt;책임&gt;'));
  assert.ok(html.includes('max-width:100%'));
});
