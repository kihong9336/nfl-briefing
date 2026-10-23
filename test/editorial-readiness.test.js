import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialReadiness, teamPlacementNotice} from '../src/editorial-readiness.js';
test('finished game with missing film cannot be labelled editorially ready',()=>{const d={date:'2026-10-23',schedule:[{gameDate:'2026-10-23',status:'종료'}],tactics:[],highlights:[]};assert.deepEqual(editorialReadiness(d).missing,['전술노트','하이라이트']);assert.equal(editorialReadiness(d).status,'needs-review');d.tactics=[{}];d.highlights=[{}];assert.equal(editorialReadiness(d).status,'structural-checks-passed');});
test('quiet day does not force invented content',()=>assert.equal(editorialReadiness({date:'2026-10-24',schedule:[],tactics:[],highlights:[]}).status,'structural-checks-passed'));
test('team news already in roundup is not represented as absent',()=>{assert.match(teamPlacementNotice([{team:'Chiefs'}],'Chiefs'),/상단/);assert.match(teamPlacementNotice([{team:'Chiefs'}],'49ers'),/별도 기사/);});
