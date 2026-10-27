const QUESTIONS = ['오늘 가장 중요한 소식은?', '전술교실을 쉽게 설명해줘', '다음 경기 관전 포인트는?'];
const STORAGE_PREFIX = 'nfl-chat:v1:';
const ERRORS = {
  429: '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.',
  503: 'AI 서비스를 준비 중이거나 잠시 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  502: 'AI 답변을 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.',
};
function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function createNflChat(root) {
  if (!root) return {setDate() {}};
  root.classList.add('nfl-chat');
  root.innerHTML = `<div class="nfl-chat-heading"><div><span class="eyebrow">ASK NFL · AI</span><h2 id="nflChatTitle">읽고 나서, NFL 질문</h2></div><button type="button" data-clear>대화 지우기</button></div><p data-date></p><p class="nfl-chat-note">Gemini + Google 검색으로 NFL을 물어보세요. 선택한 날짜의 브리핑을 참고하며, 실제 검색한 답변에만 검색 출처를 표시합니다. 답변은 출처와 함께 확인해 주세요.</p><div class="nfl-chat-chips"></div><div class="nfl-chat-log" role="log" aria-label="NFL 질문과 답변" aria-live="polite"></div><p class="nfl-chat-status" role="status"></p><button type="button" data-retry hidden>다시 시도</button><form><label for="nflChatQuestion">궁금한 NFL 이야기</label><textarea id="nflChatQuestion" rows="3" maxlength="2000" placeholder="뉴스, 전술, 관전 포인트를 물어보세요" aria-describedby="nflChatHint"></textarea><div class="nfl-chat-actions"><small id="nflChatHint">최대 2,000자 · Enter 줄바꿈 · Ctrl/⌘+Enter 전송</small><button type="submit" data-send>보내기</button></div></form>`;
  const $ = selector => root.querySelector(selector);
  const input = $('textarea'), log = $('[role=log]'), status = $('[role=status]'), send = $('[data-send]'), retry = $('[data-retry]');
  let date, history = [], pending = '', controller, generation = 0, busy = false;
  function storage() { try { return root.ownerDocument.defaultView.sessionStorage; } catch { return null; } }
  function save() {
    history = history.slice(-20);
    while (JSON.stringify(history).length > 48000) history.shift();
    try {
      const store = storage();
      store?.setItem(STORAGE_PREFIX + date, JSON.stringify(history));
      const keys = Object.keys(store ?? {}).filter(key => key.startsWith(STORAGE_PREFIX));
      while (keys.length > 7) store.removeItem(keys.shift());
    } catch { /* Private browsing / quota: conversation remains usable in memory. */ }
  }
  function draw() {
    log.replaceChildren();
    for (const message of [...history, ...(pending ? [{role:'user', content:pending}] : [])]) {
      const bubble = document.createElement('div'); bubble.className = `nfl-chat-message ${message.role}`;
      const label = document.createElement('strong'); label.textContent = message.role === 'user' ? '나' : 'NFL AI';
      const text = document.createElement('p'); text.textContent = message.content;
      bubble.append(label, text);
      if (message.role === 'assistant') {
        const provenance = document.createElement('p');
        provenance.className = 'nfl-chat-provenance';
        provenance.textContent = message.searched === true ? '검색 출처' : '브리핑 · 일반 지식 답변';
        bubble.append(provenance);
      }
      const sourceList = document.createElement('div'); sourceList.className = 'nfl-chat-sources';
      for (const source of message.sources ?? []) {
        const href = safeUrl(source.url); if (!href) continue;
        const link = document.createElement('a'); link.href = href; link.textContent = source.label; link.target = '_blank'; link.rel = 'noopener noreferrer'; sourceList.append(link);
      }
      if (sourceList.childElementCount) bubble.append(sourceList);
      log.append(bubble);
    }
    log.scrollTop = log.scrollHeight;
  }
  function setBusy(value) {
    busy = value; send.disabled = value; input.disabled = value;
    root.setAttribute('aria-busy', String(value));
    root.querySelectorAll('.nfl-chat-chips button').forEach(button => { button.disabled = value; });
  }
  function cancel() { generation++; controller?.abort(); controller = null; setBusy(false); }
  async function submit(question) {
    if (busy || !date) return;
    let messages;
    try { messages = requestMessages(history, question); } catch (error) { status.textContent = error.message; return; }
    pending = question.trim(); draw(); setBusy(true); retry.hidden = true; status.textContent = '답변을 준비하고 있습니다… 최대 80초 정도 걸릴 수 있습니다.';
    const token = ++generation, requestDate = date;
    const abort = new AbortController(); controller = abort;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, 80000);
    try {
      const response = await fetch(CHAT_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify({date:requestDate,messages}), signal:abort.signal, credentials:'omit'});
      if (!response.ok) throw new Error(ERRORS[response.status] ?? '질문을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      const result = await response.json();
      if (token !== generation) return;
      if (result.date !== requestDate || typeof result.answer !== 'string' || !result.answer.trim() || !Array.isArray(result.sources)) throw new Error('올바른 답변을 받지 못했습니다. 다시 시도해 주세요.');
      const sources = result.sources.filter(source => source && typeof source.label === 'string' && safeUrl(source.url)).slice(0, 20).map(({label,url}) => ({label:label.slice(0,300), url}));
      history.push({role:'user',content:pending}, {role:'assistant',content:result.answer.slice(0,20000),sources,searched:result.searched === true});
      pending = ''; input.value = ''; save(); draw(); status.textContent = '';
    } catch (error) {
      if (token !== generation) return;
      status.textContent = timedOut ? '답변 대기 시간이 길어 중단했습니다. 다시 시도해 주세요.' : error instanceof TypeError ? '서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' : error.message;
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
      if (token === generation) { controller = null; setBusy(false); }
    }
  }
  for (const question of QUESTIONS) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = question;
    button.addEventListener('click', () => { input.value = question; input.focus(); }); $('.nfl-chat-chips').append(button);
  }
  $('form').addEventListener('submit', event => { event.preventDefault(); submit(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) { event.preventDefault(); submit(input.value); } });
  retry.addEventListener('click', () => submit(pending));
  $('[data-clear]').addEventListener('click', () => { cancel(); history = []; pending = ''; input.value = ''; status.textContent = ''; retry.hidden = true; try { storage()?.removeItem(STORAGE_PREFIX + date); } catch {} draw(); });
  return {setDate(next) {
    if (date === next) return;
    cancel(); date = next; history = []; pending = ''; input.value = ''; status.textContent = ''; retry.hidden = true;
    try {
      const saved = JSON.parse(storage()?.getItem(STORAGE_PREFIX + date) ?? '[]');
      if (Array.isArray(saved)) history = saved.filter(message => message && ['user','assistant'].includes(message.role) && typeof message.content === 'string' && message.content.length <= 20000).slice(-20).map(message => ({role:message.role,content:message.content,searched:message.searched === true,sources:Array.isArray(message.sources) ? message.sources.filter(source => source && typeof source.label === 'string' && safeUrl(source.url)).slice(0,20) : []}));
    } catch {}
    $('[data-date]').textContent = `${date} 발행본 기준`;
    draw();
  }};
}
export const CHAT_ENDPOINT = 'https://payer-junkie-overfull.ngrok-free.dev/api/nfl-chat';
export function requestMessages(history, question) {
  const content = question.trim();
  if (!content || content.length > 2000) throw new Error('질문은 1~2,000자로 입력해 주세요.');
  const messages = history.slice(-9).map(({role, content}) => ({role, content:content.slice(0,2000)}));
  messages.push({role: 'user', content});
  while (messages.reduce((sum, message) => sum + message.content.length, 0) > 12000) messages.shift();
  return messages;
}
