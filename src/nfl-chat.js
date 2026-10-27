const QUESTIONS = ['오늘 가장 중요한 소식은?', '전술교실을 쉽게 설명해줘', '다음 경기 관전 포인트는?'];
const STORAGE_PREFIX = 'nfl-chat:shared:v2:';
const HEADERS = {'Content-Type':'application/json','ngrok-skip-browser-warning':'1'};
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
  root.innerHTML = `<div class="nfl-chat-heading"><div><span class="eyebrow">ASK NFL · AI</span><h2 id="nflChatTitle">읽고 나서, NFL 질문</h2></div><button type="button" data-clear>공용 대화 지우기</button></div><p data-date></p><p class="nfl-chat-shared">공용 대화 · 모든 방문자에게 공개됩니다.</p><p data-legacy hidden>이전 기기별 대화는 별도 보관되어 자동 합쳐지지 않습니다</p><button type="button" data-import hidden>이 기기의 이전 대화 가져오기</button><div class="nfl-chat-chips"></div><div class="nfl-chat-log" role="log" aria-label="NFL 질문과 답변" aria-live="polite"></div><p class="nfl-chat-status" role="status"></p><button type="button" data-retry hidden>다시 시도</button><form><label for="nflChatQuestion">궁금한 NFL 이야기</label><textarea id="nflChatQuestion" rows="3" maxlength="2000" placeholder="뉴스, 전술, 관전 포인트를 물어보세요" aria-describedby="nflChatHint"></textarea><div class="nfl-chat-actions"><small id="nflChatHint">최대 2,000자 · Enter 줄바꿈 · Ctrl/⌘+Enter 전송</small><button type="submit" data-send>보내기</button></div></form>`;
  const $ = selector => root.querySelector(selector);
  const input = $('textarea'), log = $('[role=log]'), status = $('[role=status]'), send = $('[data-send]'), retry = $('[data-retry]');
  let date, history = [], pending = '', controller, generation = 0, busy = false;
  let legacy = [], revision = null, synced = false, syncTask = null, syncController, destroyed = false, retryAction = 'send';
  const view = root.ownerDocument.defaultView;
  function storage() { try { return view.sessionStorage; } catch { return null; } }
  function save() {
    try { storage()?.setItem(STORAGE_PREFIX + date, JSON.stringify({date, revision, messages:history})); } catch {}
  }
  function apply(snapshot, requestDate, force = false) {
    if (snapshot.date !== requestDate || !Number.isInteger(snapshot.revision) || !Array.isArray(snapshot.messages)) throw new Error('대화 기록을 확인하지 못했습니다. 다시 시도해 주세요.');
    const changed = revision !== snapshot.revision;
    revision = snapshot.revision;
    if (changed || force) {
      history = snapshot.messages.filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string').slice(-100).map(m => ({...m, sources:Array.isArray(m.sources) ? m.sources.filter(s => s && typeof s.label === 'string' && safeUrl(s.url)) : []}));
      save(); draw();
    }
    synced = true;
    $('[data-import]').hidden = !(revision === 0 && history.length === 0 && legacy.length);
  }
  async function refresh() {
    if (!date || destroyed) return false;
    if (syncTask) return syncTask;
    const token = generation, requestDate = date, abort = new AbortController();
    syncController = abort;
    const timer = setTimeout(() => abort.abort(), 15000);
    const task = (async () => {
      try {
        const response = await fetch(CHAT_ENDPOINT + '/history?date=' + encodeURIComponent(requestDate), {headers:HEADERS,signal:abort.signal,credentials:'omit'});
        if (!response.ok) throw new Error('history unavailable');
        const snapshot = await response.json();
        if (token !== generation || destroyed) return false;
        apply(snapshot, requestDate);
        if (!busy && !pending && retry.hidden) status.textContent = '';
        return true;
      } catch {
        if (token === generation && !destroyed) {
          synced = false;
          status.textContent = '공용 대화에 연결하지 못했습니다. 저장된 대화만 표시 중이며 동기화되지 않았습니다. 다시 연결한 뒤 시도해 주세요.';
        }
        return false;
      } finally { clearTimeout(timer); if (token === generation) { syncTask = null; syncController = null; } }
    })();
    syncTask = task;
    return task;
  }
  function draw() {
    const top = log.scrollTop, atBottom = log.scrollHeight - top - log.clientHeight < 60;
    log.replaceChildren();
    for (const message of [...history, ...(pending ? [{role:'user', content:pending}] : [])].slice(-100)) {
      const bubble = document.createElement('div'); bubble.className = `nfl-chat-message ${message.role}`;
      const label = document.createElement('strong'); label.textContent = message.role === 'user' ? '질문' : 'NFL AI';
      const text = document.createElement('p'); text.textContent = message.content;
      bubble.append(label, text);
      if (message.role === 'assistant') {
        const provenance = document.createElement('p');
        provenance.className = 'nfl-chat-provenance';
        provenance.textContent = message.imported === true ? '이전 기기 대화' : message.searched === true ? '검색 출처' : '브리핑 · 일반 지식 답변';
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
    log.scrollTop = atBottom ? log.scrollHeight : top;
  }
  function setBusy(value) {
    busy = value; send.disabled = value; input.disabled = value;
     $('[data-clear]').disabled = value; $('[data-import]').disabled = value;
    root.setAttribute('aria-busy', String(value));
    root.querySelectorAll('.nfl-chat-chips button').forEach(button => { button.disabled = value; });
  }
  function cancel() { generation++; controller?.abort(); syncController?.abort(); controller = null; syncController = null; syncTask = null; setBusy(false); }
  async function mutate(kind, question = '') {
    if (busy || !date || destroyed) return;
    if (kind === 'send') {
      try { requestMessages([], question); } catch (error) { status.textContent = error.message; return; }
      pending = question.trim(); input.value = pending; draw();
    }
    retryAction = kind; retry.hidden = true; setBusy(true);
    const token = generation, requestDate = date;
    let timer;
    try {
      // Wait for initial/in-flight sync; otherwise retain the displayed revision for CAS.
      if (syncTask ? !await syncTask : !synced && !await refresh()) throw new Error('공용 대화를 동기화하지 못했습니다. 연결 후 다시 시도해 주세요.');
      if (token !== generation) return;
      const abort = new AbortController(); controller = abort;
      timer = setTimeout(() => abort.abort(), 80000);
      status.textContent = kind === 'send' ? '답변을 준비하고 있습니다… 최대 80초 정도 걸릴 수 있습니다.' : '공용 대화를 지우고 있습니다…';
      if (kind === 'import' && (revision !== 0 || history.length || !legacy.length)) throw new Error('이미 공용 대화가 있습니다. 이전 대화를 가져오지 않았습니다.');
      const body = kind === 'import' ? {date:requestDate,revision:0,messages:legacy} : kind === 'send' ? {date:requestDate, messages:requestMessages(history,pending), user:pending, revision} : {date:requestDate,revision};
      const response = await fetch(CHAT_ENDPOINT + (kind === 'import' ? '/history/import' : kind === 'clear' ? '/history?date=' + encodeURIComponent(requestDate) : ''), {method:kind === 'clear' ? 'DELETE' : 'POST',headers:HEADERS,body:JSON.stringify(body),signal:abort.signal,credentials:'omit'});
      if (token !== generation) return;
      if (response.status === 409) {
        await refresh();
        throw new Error(kind === 'clear' ? '다른 곳에서 대화가 갱신되었습니다. 내용을 확인한 뒤 지우기를 다시 시도해 주세요.' : '다른 곳에서 대화가 갱신되었습니다. 질문은 보관했습니다. 확인 후 다시 시도해 주세요.');
      }
      if (!response.ok) throw new Error(ERRORS[response.status] ?? '요청을 처리하지 못했습니다. 다시 시도해 주세요.');
      const result = await response.json();
      if (token !== generation) return;
      apply(result, requestDate, true);
      pending = ''; input.value = ''; draw(); status.textContent = ''; retry.hidden = true;
    } catch (error) {
      if (token !== generation) return;
      status.textContent = error.name === 'AbortError' ? '요청 대기 시간이 길어 중단했습니다. 기록을 확인한 뒤 다시 시도해 주세요.' : error instanceof TypeError ? '서버에 연결하지 못했습니다. 저장된 대화는 유지됩니다. 연결 후 다시 시도해 주세요.' : error.message;
      retry.hidden = false;
    } finally { clearTimeout(timer); if (token === generation) {controller = null; setBusy(false);} }
  }
  const submit = question => mutate('send', question);
  for (const question of QUESTIONS) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = question;
    button.addEventListener('click', () => { input.value = question; input.focus(); }); $('.nfl-chat-chips').append(button);
  }
  $('form').addEventListener('submit', event => { event.preventDefault(); submit(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) { event.preventDefault(); submit(input.value); } });
  retry.addEventListener('click', () => mutate(retryAction, pending || input.value));
  $('[data-import]').addEventListener('click', () => mutate('import'));
  $('[data-clear]').addEventListener('click', () => mutate('clear'));
  const wake = () => { if (!busy && root.ownerDocument.visibilityState !== 'hidden') void refresh(); };
  view.addEventListener('focus', wake);
  root.ownerDocument.addEventListener('visibilitychange', wake);
  const poll = setInterval(wake, 5000); poll.unref?.();
  return {
    refresh,
    destroy() { destroyed = true; cancel(); clearInterval(poll); view.removeEventListener('focus', wake); root.ownerDocument.removeEventListener('visibilitychange', wake); },
    setDate(next) {
      if (date === next) return refresh();
      cancel(); date = next; history = []; revision = null; synced = false; pending = ''; input.value = ''; status.textContent = '공용 대화를 불러오고 있습니다…'; retry.hidden = true;
      legacy = []; $('[data-import]').hidden = true; $('[data-legacy]').hidden = true;
      try {
        const old = JSON.parse(storage()?.getItem('nfl-chat:v1:' + date) ?? '[]');
        legacy = Array.isArray(old) ? old.filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim()).slice(-100) : [];
        $('[data-legacy]').hidden = !legacy.length;
        const saved = JSON.parse(storage()?.getItem(STORAGE_PREFIX + date) ?? 'null');
        if (saved) { apply(saved, date, true); synced = false; }
      } catch {}
      $('[data-date]').textContent = `${date} 발행본 기준`;
      draw();
      return refresh();
    }
  };
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
