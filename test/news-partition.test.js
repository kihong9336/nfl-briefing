import test from 'node:test';
import assert from 'node:assert/strict';
import * as helpers from '../src/briefing.js';
import {briefings} from '../src/data.js';
test('news partition selects actual first three main and one league, leaving disjoint cards', () => {
 for (const edition of [...briefings, {sections: [], leagueWide: []}]) for (const filter of ['all','Chiefs','Patriots','49ers']) {
  const p = helpers.partitionNews(edition, filter);
  assert.deepEqual(p.topStories, edition.sections.slice(0,3));
  assert.deepEqual(p.topLeague, (edition.leagueWide ?? []).slice(0,1));
  const cards = [...p.topStories,...p.topLeague,...p.leagueStories,...p.leagueItems,...p.favorites];
  assert.equal(new Set(cards).size, cards.length);
  assert.ok(p.favorites.every(s=>s.team !== 'NFL' && (filter==='all'||s.team===filter)));
  if(filter==='all') assert.equal(cards.length,edition.sections.length+(edition.leagueWide??[]).length);
 }
 const today=helpers.partitionNews(briefings.find(b=>b.date==='2026-10-18'),'all');
 assert.equal(today.topStories.length+today.topLeague.length,3);
 assert.equal(today.leagueItems.length,1);
});
