import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

 test('DOM sends real contract, safely renders, retries and isolates editions', async () => {
  const server = createServer((req,res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(readFileSync(new URL('../src/nfl-chat.js', import.meta.url)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    let snapshot = {date:'2026-10-26',revision:0,messages:[]};
    await page.route('**/api/nfl-chat/history?*', async route => {
      const date = new URL(route.request().url()).searchParams.get('date');
      if (route.request().method() === 'DELETE') snapshot = {date, revision:snapshot.revision+1,messages:[]};
      await route.fulfill({contentType:'application/json',body:JSON.stringify(date === snapshot.date ? snapshot : {date,revision:0,messages:[]})});
    });
    await page.evaluate(async () => {
      document.body.innerHTML = '<section id="chat"></section>';
      const module = await import('/chat.js');
      if (!module.createNflChat) throw new Error('createNflChat is missing');
      window.chat = module.createNflChat(document.querySelector('#chat'));
      window.chat.setDate('2026-10-26');
    });
    let requests = [];
    let status = 200;
    let searched = true;
    const answer = '<img src=x onerror=alert(1)> 실제 응답' + ' 긴 설명'.repeat(1000);
    await page.route('https://payer-junkie-overfull.ngrok-free.dev/api/nfl-chat', async route => {
      requests.push(route.request().postDataJSON());
      assert.equal(route.request().headers()['ngrok-skip-browser-warning'], '1');
      const sources = [{label:'<img src=x> 공식 자료',url:'https://www.nfl.com/'},{label:'위험',url:'javascript:alert(1)'}];
      if (status === 200) snapshot = {...snapshot,revision:snapshot.revision+1,messages:[...snapshot.messages,requests.at(-1).messages.at(-1),{role:'assistant',content:answer,searched,sources}]};
      await route.fulfill({status, contentType:'application/json', body:JSON.stringify({...snapshot, answer, model:'google/gemini-3.8-flash', searched, sources})});
    });
    assert.equal(requests.length, 0);
    await page.locator('textarea').fill('첫 질문');
    await page.locator('textarea').press('Enter');
    assert.equal(requests.length, 0);
    await page.locator('textarea').press('Control+Enter');
    await page.getByText(answer, {exact:true}).waitFor();
    assert.equal(await page.locator('#chat img').count(), 0);
    assert.equal(await page.locator('#chat a').count(), 1);
    assert.equal(await page.getByText('검색 출처', {exact:true}).count(), 1);
    assert.match(await page.locator('.nfl-chat-note').innerText(), /Gemini.*Google 검색/);
    assert.deepEqual(requests[0], {date:'2026-10-26',revision:0,user:'첫 질문',messages:[{role:'user',content:'첫 질문'}]});
    status = 429;
    await page.locator('textarea').fill('후속 질문');
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await page.getByRole('button',{name:'다시 시도',exact:true}).waitFor();
    assert.match(await page.locator('[role=status]').innerText(), /잠시/);
    status = 200;
    searched = false;
    await page.getByRole('button',{name:'다시 시도',exact:true}).click();
    await page.waitForFunction(() => !document.querySelector('[data-send]').disabled);
    assert.equal(requests[2].messages.length, 3);
    assert.equal(requests[2].messages[1].content.length, 2000);
    assert.equal(await page.locator('.nfl-chat-message.assistant > p').first().textContent(), answer);
    assert.equal(await page.locator('#chat a').first().textContent(), '<img src=x> 공식 자료');
    assert.equal(await page.getByText('검색 출처', {exact:true}).count(), 1);
    assert.equal(await page.getByText('브리핑 · 일반 지식 답변', {exact:true}).count(), 1);
    await page.evaluate(() => window.chat.setDate('2026-10-25'));
    assert.equal(await page.locator('[role=log]').innerText(), '');
    await page.evaluate(() => window.chat.setDate('2026-10-26'));
    assert.match(await page.locator('[role=log]').innerText(), /첫 질문/);
    assert.equal(await page.getByText('검색 출처', {exact:true}).count(), 1);
    status = 503;
    await page.locator('textarea').fill('서비스 상태');
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await page.getByRole('button',{name:'다시 시도',exact:true}).waitFor();
    assert.match(await page.locator('[role=status]').innerText(), /준비 중/);
    assert.doesNotMatch(await page.locator('[role=status]').innerText(), /Gemini|Google|검색 완료/);
    await page.getByRole('button',{name:'공용 대화 지우기'}).click();
    await page.waitForFunction(() => !document.querySelector('[data-send]').disabled);
    assert.equal(await page.locator('[role=log]').innerText(), '');
    await page.unroute('**/api/nfl-chat');
    let complete;
    await page.route('**/api/nfl-chat', route => new Promise(resolve => { complete = async () => { try { await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({date:'2026-10-26',answer:'STALE ANSWER',sources:[]})}); } catch {} resolve(); }; }));
    await page.locator('textarea').fill('느린 요청');
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('[data-send]').disabled);
    await page.evaluate(() => window.chat.setDate('2026-10-25'));
    if (complete) await complete();
    assert.equal(await page.locator('[role=log]').innerText(), '');
    assert.equal(await page.locator('[data-send]').isDisabled(), false);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});

test('interactive and dated static editions mount chat after reading content', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('id="nflChat"') > html.indexOf('id="highlights"'));
  assert.ok(html.indexOf('id="nflChat"') < html.indexOf('<footer class="site-footer"'));
  assert.match(html, /nfl-chat\.css/);
  const {generateStaticPages} = await import('../src/static-pages.js');
  const {briefings} = await import('../src/data.js');
  const pages = generateStaticPages(briefings);
  const dated = pages[`editions/${briefings[0].date}/index.html`];
  assert.match(dated, /id="nflChat"/);
  assert.match(dated, /nfl-chat\.js/);
  assert.ok(dated.indexOf('id="nflChat"') < dated.lastIndexOf('<footer>'));
});

test('chat request keeps latest nine plus new user within server limits', async () => {
  assert.ok(existsSync(new URL('../src/nfl-chat.js', import.meta.url)), 'chat module exists');
  const { requestMessages } = await import('../src/nfl-chat.js');
  const history = Array.from({length: 14}, (_, i) => ({role: i % 2 ? 'assistant' : 'user', content: String(i).repeat(900)}));
  const messages = requestMessages(history, '질문');
  assert.ok(messages.length <= 10);
  assert.ok(messages.reduce((n,m) => n + m.content.length, 0) <= 12000);
  assert.deepEqual(messages.at(-1), {role: 'user', content: '질문'});
  assert.throws(() => requestMessages([], 'x'.repeat(2001)));
  const longAnswer = {role:'assistant',content:'긴 답변'.repeat(2000)};
  const clipped = requestMessages([longAnswer], '후속 질문');
  assert.equal(clipped[0].content.length, 2000);
  assert.equal(longAnswer.content, '긴 답변'.repeat(2000), 'display history remains intact');
});
