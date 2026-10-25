import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {partitionNews} from '../src/briefing.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function fn(name,next){return app.slice(app.indexOf(`function ${name}(`),app.indexOf(`function ${next}(`));}
test('roundup preserves mixed editorial order and opens the same canonical league details',()=>{
 const section={id:'core',eventKey:'core',team:'Chiefs',title:'CORE',summary:'BODY MUST STAY IN SHEET'};
 const first={eventKey:'first',title:'FIRST',why:'FIRST BODY'};
 const selected={eventKey:'selected',title:'SELECTED',why:'SELECTED BODY'};
 const news=partitionNews({sections:[section],leagueWide:[first,selected],topStoryKeys:['selected','core']});
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',querySelectorAll(){return [...this.innerHTML.matchAll(/data-league-index="(\d+)"/g)].map(match=>({dataset:{leagueIndex:match[1]},addEventListener(type,cb){this.click=cb;nodes.set(`${id}:${match[1]}`,this);}}));}});return nodes.get(id);};
 let detail;
 const context={$:node,h:String,plainTitle:x=>x,teamMeta:()=>({code:'KC'}),bindStoryButtons(){},showDetailSheet:x=>{detail=x;}};
 vm.runInNewContext(fn('bindLeagueButtons','leagueCards')+fn('renderRoundup','shortExtract')+'\nthis.renderRoundup=renderRoundup;',context);
 context.renderRoundup(news);
 const html=node('#leadStory').innerHTML;
 assert.ok(html.indexOf('SELECTED')<html.indexOf('CORE'));
 assert.ok(!html.includes(section.summary));
 nodes.get('#leadStory:0').click();
 assert.equal(detail.title,'SELECTED');
 assert.equal(detail.blocks[0].text,'SELECTED BODY');
 // The category uses a different array/index; it must still open its own item.
 const category=node('#category');category.innerHTML='<button data-league-index="0"></button>';
 context.category=category;context.items=news.leagueItems;
 vm.runInNewContext('bindLeagueButtons(category,items)',context);
 nodes.get('#category:0').click();
 assert.equal(detail.title,'FIRST');
});
test('category copy promises all articles and empty teams never claim their articles moved upstairs',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('기사를 제외한'));
 assert.ok(!app.includes('짧은 브리핑 외 추가 소식'));
 assert.ok(!fn('renderStories','renderTactics').includes('teamPlacementNotice'));
});
