import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('story detail preserves every watch sentence', () => {
 const code = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
 let detail;
 const context = { teamMeta: () => ({label: 'test'}), showDetailSheet: value => { detail = value; }, shortExtract: text => text.split('. ')[0] };
 vm.runInNewContext(code.slice(code.indexOf('function openStorySheet('), code.indexOf('function bindStoryButtons(')) + '\nopenStorySheet({team: \'NFL\', watch: \'First point. Second important point.\'});', context);
 assert.equal(detail.blocks[2].text, 'First point. Second important point.');
});
