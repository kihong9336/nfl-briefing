import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateEdition} from '../src/publish.js';
import {briefings} from '../src/data.js';
test('optional update metadata requires explicit evidence and valid kind',()=>{
 const e=structuredClone(briefings[0]);
 e.sections[0].update={kind:'new'};
 assert.throws(()=>validateEdition(e),/update/);
 e.sections[0].update={kind:'followup',evidence:'https://www.nfl.com/news/example'};
 assert.equal(validateEdition(e),e);
 e.sections[0].update.kind='invented';
 assert.throws(()=>validateEdition(e),/update/);
});
test('glossary and explicit source times are available without inventing edition verification',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/용어 도움말/);
 assert.match(app,/FP.*LP.*DNP/s);
 assert.match(app,/source\.publishedAt/);
});
