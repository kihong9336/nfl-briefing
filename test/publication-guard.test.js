import test from 'node:test';
import assert from 'node:assert/strict';
import {guardPublication} from '../src/publication-guard.js';
const story = {team:'Ravens', title:'Old headline', summary:'The quarterback will miss the next game.', sources:[{url:'https://www.nfl.com/news/qb-out'}]};
const old = {date:'2026-10-17', sample:false, sections:[story], leagueWide:[]};
test('rolling game-center, schedule and injury-report sources are not event identity', () => {
 for (const path of ['/game-day/2026/reg-week6/chargers-at-chiefs/', '/schedule/2026/', '/team/injury-report/']) {
  const url = 'https://www.chiefs.com' + path;
  const prior = {...old, sections:[{...story, team:'Chiefs', title:'Rice injury preview', summary:'The receiver was limited in practice before the game.', sources:[{url}]}]};
  const result = {...story, team:'Chiefs', title:'Chiefs win game result', summary:'Kansas City won the completed football game by three points.', eventKey:'chiefs-game-result', sources:[{url}]};
  assert.doesNotThrow(()=>guardPublication([prior],edition(result)));
 }
});
test('changing event keys cannot hide identical factual text', () => {
 const prev={...old,sections:[{...story,eventKey:'first-key'}]};
 assert.throws(()=>guardPublication([prev],edition({...story,eventKey:'renamed-key'})),/repeated event/);
});
test('malformed legacy URLs do not crash comparison', () => {
 assert.doesNotThrow(()=>guardPublication([old],edition({...story,sources:[{url:'bad'}],summary:'A distinct factual update not matching previous.'})));
});
const edition = item => ({date:'2026-10-18', sample:false, sections:[item], leagueWide:[]});
test('legacy source identity catches reworded copy, but titles alone do not', () => {
 assert.throws(() => guardPublication([old], edition({...story, title:'Entirely reworded', summary:'New prose but unchanged status.'})), /repeated event/);
 assert.doesNotThrow(() => guardPublication([old], edition({...story, summary:'A different event with a matching headline.', sources:[{url:'https://www.nfl.com/news/different'}]})));
});
test('same event is merged within edition even across section and team labels', () => {
 const a = {...story,eventKey:'2026-ravens-qb'};
 const current = edition(a); current.leagueWide = [{...a,team:'Baltimore Ravens'}];
 assert.throws(() => guardPublication([],current), /within edition/);
});
test('same-date replacement, samples and editions outside seven days are excluded', () => {
 for (const previous of [{...old,date:'2026-10-18'},{...old,sample:true},{...old,date:'2026-10-10'}]) assert.doesNotThrow(() => guardPublication([previous],edition(story)));
});
test('tracking query strings cannot hide repeated source identity', () => {
 assert.throws(() => guardPublication([old],edition({...story,summary:'A rewritten sentence.',sources:[{url:story.sources[0].url+'?utm_source=feed#top'}]})), /repeated event/);
});
