import test from 'node:test';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
test('two-back diagram labels fit without overlap at 320px', async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:320,height:850}});
    await page.setContent('<style>'+readFileSync(new URL('../styles.css',import.meta.url),'utf8')+'</style>'+renderTacticDiagram(tactic));
    const errors=await page.locator('svg').evaluateAll(svgs=>svgs.flatMap(svg=>{
      const box=svg.getBoundingClientRect(), texts=[...svg.querySelectorAll('text')].map(t=>({text:t.textContent,box:t.getBoundingClientRect()}));
      const problems=[];
      for(let i=0;i<texts.length;i++){
        const a=texts[i].box;
        if(a.left<box.left-1||a.right>box.right+1)problems.push('outside: '+texts[i].text);
        for(let j=i+1;j<texts.length;j++){const b=texts[j].box;if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)problems.push('overlap: '+texts[i].text+' / '+texts[j].text);}
      }return problems;
    }));
    assert.deepEqual(errors,[]);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }finally{await browser.close();}
});
import assert from 'node:assert/strict';
import {briefings} from '../src/data.js';
import {validateEdition} from '../src/publish.js';
import {renderTacticDiagram} from '../src/tactic-visuals.js';
const tactic = {id:'two-back-test',team:'Patriots',label:'전술 교실',title:'풀백 리드 러닝과 플레이액션의 출발 비교',concept:'풀백이 앞에서 블로킹하는 러닝과 플레이액션을 비교한다.',easy:'공을 넘기면 러닝, 회수한 QB는 패스를 준비한다.',gameUse:'구단 기자가 제안한 경기 전 관전 포인트이며 실제 콜 재현이 아니다.',whyItWorks:'비슷한 출발 동작이 수비의 첫 반응에 영향을 줄 수 있다.',defenseCounter:'라인배커는 러닝 책임과 뒤 공간 커버를 함께 지켜야 한다.',diagram:{kind:'two-back-lead-play-action',caption:'일반 개념도이며 실제 경기 배치를 재현하지 않는다.'},breakdown:[1,2,3].map(n=>({label:String(n),text:'공격과 수비의 역할을 순서대로 확인하는 단계이다.'})),watchOrder:['풀백의 첫발 확인','QB의 공 회수 확인','라인배커의 반응 확인'],source:{label:'Patriots',url:'https://www.patriots.com/'}};
test('two-back diagram validates for publication',()=>{const edition=structuredClone(briefings.find(e=>!e.sample));edition.tactics=[tactic];assert.doesNotThrow(()=>validateEdition(edition));});
test('two-back diagram has mobile stacked panels, distinct possession and paths',()=>{const html=renderTacticDiagram(tactic);assert.equal((html.match(/viewBox="0 0 320 340"/g)||[]).length,3);for(const token of ['data-panel="alignment"','data-panel="run"','data-panel="play-action"','data-ball="RB"','data-ball="QB"','data-action="lead-block"','data-action="run-path"','data-action="pass-path"','일반 개념도'])assert.ok(html.includes(token),token);assert.ok(!html.includes('diagram-fallback'));assert.ok(html.includes('width:100%'));});
