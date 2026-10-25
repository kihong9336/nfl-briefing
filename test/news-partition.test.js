import test from 'node:test';
import assert from 'node:assert/strict';
import * as helpers from '../src/briefing.js';
import {briefings} from '../src/data.js';

test('editorial keys select ordered headlines across both sources without removing category articles', () => {
 const core={id:'core',eventKey:'kirk',team:'49ers'};
 const other={id:'other',eventKey:'lamar',team:'Ravens'};
 const fantasy={id:'fantasy',eventKey:'dst'};
 const edition={sections:[core,other],leagueWide:[fantasy],topStoryKeys:['lamar','dst','core']};
 const p=helpers.partitionNews(edition);
 assert.deepEqual(p.headlines.map(entry=>entry.item),[other,fantasy,core]);
 assert.deepEqual(p.headlines.map(entry=>entry.kind),['story','league','story']);
 assert.deepEqual(p.favorites,[core]);
 assert.deepEqual(p.leagueStories,[other]);
 assert.deepEqual(p.leagueItems,[fantasy]);
});

test('every canonical category remains complete for every edition and filter', () => {
 for (const edition of [...briefings,{sections:[],leagueWide:[]}]) {
  for (const filter of ['all','Chiefs','Patriots','49ers']) {
   const p=helpers.partitionNews(edition,filter);
   assert.deepEqual(p.favorites,edition.sections.filter(s=>['49ers','Chiefs','Patriots'].includes(s.team)&&(filter==='all'||s.team===filter)));
   assert.deepEqual(p.leagueStories,edition.sections.filter(s=>!['49ers','Chiefs','Patriots'].includes(s.team)));
   assert.deepEqual(p.leagueItems,edition.leagueWide??[]);
   assert.deepEqual(p.headlines,helpers.partitionNews(edition).headlines);
   assert.ok(p.headlines.length<=5);
  }
 }
});
test('legacy fallback interleaves sources deterministically, explicit keys deduplicate and cap at five',()=>{
 const sections=Array.from({length:7},(_,i)=>({id:`s${i}`,eventKey:`e${i}`,team:'NFL'}));
 const leagueWide=[{id:'l0'},{id:'l1'}];
 const legacy=helpers.partitionNews({sections,leagueWide});
 assert.deepEqual(legacy.headlines.map(e=>e.item.id),['s0','l0','s1','l1','s2']);
 assert.equal(legacy.editorial,false);
 const selected=helpers.partitionNews({sections,leagueWide,topStoryKeys:['missing','e2','s2','l1','e6','e5','e4','e3']});
 assert.deepEqual(selected.headlines.map(e=>e.item.id),['s2','l1','s6','s5','s4']);
 assert.equal(selected.editorial,true);
 assert.deepEqual(helpers.partitionNews({sections,leagueWide,topStoryKeys:[]}).headlines,[]);
});
