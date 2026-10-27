import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {chromium} from 'playwright';

test('two clients share authoritative history, poll safely, preserve conflicts and explicitly import legacy', async () => {
 const server = createServer((req,res) => {res.setHeader('Content-Type','text/javascript');res.end(readFileSync(new URL('../src/nfl-chat.js',import.meta.url)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch();
 let snapshot={date:'2026-10-26',revision:0,messages:[]}, offline=false, conflict=false, posts=0, reads=0, delayed;
 try {
  const pages=[];
  for(let i=0;i<2;i++) {
   const page=await browser.newPage(); pages.push(page);
   await page.goto(`http://127.0.0.1:${server.address().port}`);
   await page.clock.install();
   await page.route('**/api/nfl-chat**',async route=>{
    const req=route.request(), url=new URL(req.url());
    assert.equal(req.headers()['ngrok-skip-browser-warning'],'1');
    if(req.method()==='GET') {
     reads++;
     if(offline) return route.abort();
     const date=url.searchParams.get('date');
     if(date==='2026-10-24') { delayed=route; return; }
     return route.fulfill({json:date===snapshot.date?snapshot:{date,revision:0,messages:[]}});
    }
    const body=req.postDataJSON();
    if(url.pathname.endsWith('/import')) {
     assert.equal(body.revision,0);
     snapshot={...snapshot,revision:1,messages:body.messages.map(m=>({...m,imported:true,searched:false}))};
     return route.fulfill({json:snapshot});
    }
    if(req.method()==='POST') posts++;
    if(conflict) {
     snapshot={...snapshot,revision:snapshot.revision+1,messages:[{role:'user',content:'다른 기기 업데이트'}]};
     return route.fulfill({status:409,json:{error:'conflict'}});
    }
    assert.equal(body.revision,snapshot.revision);
    snapshot={...snapshot,revision:snapshot.revision+1,messages:req.method()==='DELETE'?[]:[...snapshot.messages,{role:'user',content:body.user}]};
    return route.fulfill({json:snapshot});
   });
   await page.evaluate(async i=>{
    document.body.innerHTML='<section id="chat"></section>';
    if(i===0)sessionStorage.setItem('nfl-chat:v1:2026-10-26',JSON.stringify([{role:'assistant',content:'legacy only'}]));
    const {createNflChat}=await import('/chat.js'); window.chat=createNflChat(document.querySelector('#chat')); await chat.setDate('2026-10-26');
   },i);
  }
  const [a,b]=pages;
  assert.equal(snapshot.revision,0);
  assert.equal(await a.locator('[role=log]').innerText(),'');
  assert.equal(await b.locator('[data-legacy]').isVisible(),false);
  await a.getByRole('button',{name:'이 기기의 이전 대화 가져오기'}).click();
  await a.getByText('이전 기기 대화',{exact:true}).waitFor();
  await b.clock.runFor(5000); await b.getByText('legacy only',{exact:true}).waitFor();
  assert.equal(posts,0);
  await b.evaluate(()=>{window.first=document.querySelector('[role=log]').firstChild;});
  await b.evaluate(()=>chat.refresh());
  assert.equal(await b.evaluate(()=>first===document.querySelector('[role=log]').firstChild),true);
  snapshot={...snapshot,revision:2,messages:Array.from({length:100},(_,i)=>({role:'user',content:'item '+i}))};
  await b.evaluate(()=>chat.refresh());
  assert.equal(await b.locator('.nfl-chat-message').count(),100);
  offline=true; await b.evaluate(()=>chat.refresh());
  assert.equal(await b.locator('.nfl-chat-message').count(),100);
  assert.match(await b.locator('[role=status]').innerText(),/동기화되지/);
  offline=false; conflict=true;
  await b.locator('textarea').fill('preserved draft'); await b.locator('[data-send]').click();
  await b.locator('[data-retry]').waitFor();
  assert.equal(posts,1); assert.equal(await b.locator('textarea').inputValue(),'preserved draft');
  assert.match(await b.locator('[role=log]').innerText(),/다른 기기 업데이트/);
  await b.getByRole('button',{name:'공용 대화 지우기',exact:true}).click();
  await b.waitForFunction(()=>!document.querySelector('[data-send]').disabled);
  assert.match(await b.locator('[role=log]').innerText(),/다른 기기 업데이트/);
  conflict=false;
  await b.locator('[data-retry]').click(); await b.waitForFunction(()=>!document.querySelector('[data-send]').disabled);
  assert.equal(await b.locator('[role=log]').innerText(),'');
  await a.evaluate(()=>chat.refresh());
  assert.equal(await a.getByRole('button',{name:'이 기기의 이전 대화 가져오기'}).isVisible(),false);
  assert.ok(await a.evaluate(()=>sessionStorage.getItem('nfl-chat:v1:2026-10-26')));
  await b.evaluate(()=>{void chat.setDate('2026-10-24');});
  await b.waitForTimeout(50);
  await b.evaluate(()=>chat.setDate('2026-10-25'));
  if(delayed) await delayed.fulfill({json:{date:'2026-10-24',revision:99,messages:[{role:'user',content:'STALE'}]}}).catch(()=>{});
  assert.equal(await b.locator('[role=log]').innerText(),'');
  const before=reads; await b.evaluate(()=>chat.destroy()); await b.clock.runFor(10000); assert.equal(reads,before);
 } finally {await browser.close(); await new Promise(r=>server.close(r));}
});
