import { briefings } from './data.js?v=20261017-context3';
import {
  availableDates,
  briefingForDate,
  neighboringDates,
  normalizeDateParam,
} from './briefing.js?v=20261017-context3';
import { escapeHtml, safeHttpsUrl } from './render-utils.js?v=20261017-context3';
import { renderTacticDiagram } from './tactic-visuals.js?v=20261017-context3';

const $ = (selector) => document.querySelector(selector);
const h = escapeHtml;
const storySheet = $('#storySheet');
const storySheetContent = $('#storySheetContent');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}

const params = new URLSearchParams(window.location.search);
let currentDate = normalizeDateParam(params.get('date'), briefings);
let currentFilter = ['49ers', 'Chiefs', 'Patriots'].includes(params.get('team')) ? params.get('team') : 'all';
let sheetTrigger;
let sheetScroll = 0;

function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function setUrl() {
  const next = new URL(window.location.href);
  next.searchParams.set('date', currentDate);
  if (currentFilter === 'all') next.searchParams.delete('team');
  else next.searchParams.set('team', currentFilter);
  window.history.pushState({}, '', next);
}

function changeDate(date) {
  if (!availableDates(briefings).includes(date)) return;
  currentDate = date;
  setUrl();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDates() {
  const dates = availableDates(briefings);
  $('#dateRail').innerHTML = dates
    .map((date) => `<button class="date-chip ${date === currentDate ? 'is-active' : ''}" data-date="${h(date)}"><span>${h(formatDate(date))}</span><small>${h(briefingForDate(date, briefings).weekday)}</small></button>`)
    .join('');

  $('#dateRail').querySelectorAll('[data-date]').forEach((button) => {
    button.addEventListener('click', () => changeDate(button.dataset.date));
  });

  const groups = new Map();
  for (const date of dates) {
    const edition = briefingForDate(date, briefings);
    // Read only supplied metadata, never infer NFL weeks from calendar dates.
    const declared = String(edition.edition ?? '').match(/(\d{4})\s+WEEK\s+(\d+)/i);
    const season = edition.season ?? declared?.[1];
    const week = edition.week ?? declared?.[2];
    const group = season && week ? `${season} 시즌 · ${week}주차` : '주차 미지정 · 기타 발행본';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(edition);
  }
  $('#archiveSelect').innerHTML = [...groups].map(([group, editions]) => `<optgroup label="${h(group)}">${editions.map(edition => `<option value="${h(edition.date)}" ${edition.date === currentDate ? 'selected' : ''}>${h(edition.date)}${edition.sample === false ? '' : ' · 샘플'}</option>`).join('')}</optgroup>`).join('');
  const neighbors = neighboringDates(currentDate, briefings);
  $('#olderButton').disabled = !neighbors.older;
  $('#newerButton').disabled = !neighbors.newer;
  $('#olderButton').onclick = () => neighbors.older && changeDate(neighbors.older);
  $('#newerButton').onclick = () => neighbors.newer && changeDate(neighbors.newer);
  $('#datePicker').value = currentDate;
}

function plainTitle(title) {
  const terms = {fp: '훈련 전면 참가', lp: '훈련 제한 참가', dnp: '훈련 불참', out: '경기 결장', questionable: '출전 여부 불확실'};
  return title.replace(/\b(FP|LP|DNP|OUT|Questionable)\b/gi, term => `${terms[term.toLowerCase()]}(${term})`);
}

function teamMeta(team) {
  const teams = {
    '49ers': { code: 'SF', label: '49ERS FOCUS' },
    Chiefs: { code: 'KC', label: 'CHIEFS FOCUS' },
    Patriots: { code: 'NE', label: 'PATRIOTS FOCUS' },
    NFL: { code: 'NFL', label: 'LEAGUE FOCUS' },
  };
  return teams[team] ?? { code: team.slice(0, 3).toUpperCase(), label: team };
}

function closeStorySheet() {
  if (window.history.state?.detail) window.history.back();
  else if (storySheet.open) storySheet.close();
}

function showDetailSheet(detail, restore = false) {
  const { header, label, title, blocks, sources = [] } = detail;
  sheetTrigger = document.activeElement;
  sheetScroll = window.scrollY;
  if (!restore) window.history.pushState({detail}, '', window.location.href);
  $('#storySheetTitle').textContent = header;
  storySheetContent.innerHTML = `
    <span class="story-label">${h(label)}</span>
    <h2>${h(plainTitle(title))}</h2>
    ${blocks.map((block, index) => `<details class="story-stage ${block.emphasis ? 'sheet-analysis' : ''}" ${index === 0 ? 'open' : ''}><summary>${h(block.label)}</summary><p>${h(block.text)}</p></details>`).join('')}
    ${sources.length ? `<div class="story-sources">${sources.map((source) => `<a href="${h(safeHttpsUrl(source.url))}" target="_blank" rel="noreferrer">↗ ${h(source.label)}${source.publishedAt ? ` · 원문 게시 ${h(source.publishedAt)}` : ''}</a>`).join('')}</div>` : ''}`;
  document.body.classList.add('sheet-open');
  storySheetContent.insertAdjacentHTML('beforeend', `<details class="glossary"><summary>용어 도움말 · 탭하여 펼치기</summary><dl><dt>FP</dt><dd>훈련 전면 참가</dd><dt>LP</dt><dd>훈련 제한 참가</dd><dt>DNP</dt><dd>훈련 불참</dd><dt>out</dt><dd>해당 경기 결장</dd><dt>questionable</dt><dd>경기 출전 여부 불확실</dd></dl><p>훈련 참가와 경기 출전 상태는 다릅니다. 이 설명은 기사에 보도된 상태를 바꾸지 않습니다.</p></details>`);
  storySheet.showModal();
  $('#storySheetClose').focus();
}

function openStorySheet(story) {
  const meta = teamMeta(story.team);
  showDetailSheet({
    header: '전체 해설',
    label: story.label || meta.label,
    title: story.title,
    blocks: [
      { label: '무슨 일인가 · 보도 요약', text: story.summary },
      { label: '왜 중요한가 · 해석', text: story.commentary, emphasis: true },
      { label: '경기에서 볼 것 · 관전 제안', text: story.watch },
    ],
    sources: [...(story.sources ?? []), ...(story.update?.evidence ? [{label: '변경 근거', url: story.update.evidence}] : [])],
  });
}

function bindStoryButtons(container, stories) {
  container.querySelectorAll('[data-story-id]').forEach(button => {
    button.addEventListener('click', () => {
      const story = stories.find(item => item.id === button.dataset.storyId);
      if (story) openStorySheet(story);
    });
  });
}
function renderRoundup(briefing) {
  const leagueItems = briefing.leagueWide ?? [];
  // Keep source order; this is a compact selection, not a news ranking.
  const stories = briefing.sections.slice(0, leagueItems.length ? 3 : 4);
  $('#leadStory').innerHTML = `<span class="eyebrow">DAILY ROUNDUP</span><h2 id="leadTitle">오늘의 짧은 브리핑</h2><ol class="roundup-list">${stories.map(story => `<li><button data-story-id="${h(story.id)}"><span>${h(teamMeta(story.team).code)}</span>${h(plainTitle(story.title))} <b aria-hidden="true">↗</b></button></li>`).join('')}${leagueItems.length ? `<li><button data-league-index="0"><span>NFL</span>${h(plainTitle(leagueItems[0].title))} <b aria-hidden="true">↗</b></button></li>` : ''}</ol>`;
  bindStoryButtons($('#leadStory'), stories);
  bindLeagueButtons($('#leadStory'), leagueItems);
}
function shortExtract(text) {
  return String(text ?? '').trim().match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || String(text ?? '').trim();
}
function takeaway(item) {
  const explicit = typeof item.takeaway === 'string' && item.takeaway.trim();
  const text = explicit || shortExtract(item.commentary || item.why);
  return text ? `<p class="story-takeaway"><small>${explicit ? '핵심' : item.why ? '보도·해석 혼합 발췌' : '해설 발췌'}</small> ${h(text)}</p>` : '';
}
function storyCard(story) {
  return `<article class="story story-${h(story.team.toLowerCase())}"><button class="story-card-button" data-story-id="${h(story.id)}"><span class="story-label">${h(story.label)}</span>${story.update?.evidence && ['new','status-change','followup'].includes(story.update.kind) ? `<span class="update-badge"> · ${h({new:'새 소식','status-change':'상태 변화',followup:'후속'}[story.update.kind])}</span>` : ''}<h3>${h(plainTitle(story.title))}</h3>${takeaway(story)}<span class="card-action">보도 요약 · 해석 읽기 →</span></button></article>`;
}
function renderStories(briefing) {
  const stories = briefing.sections.filter(story => story.team !== 'NFL' && (currentFilter === 'all' || story.team === currentFilter));
  $('#storyList').innerHTML = stories.map(storyCard).join('');
  bindStoryButtons($('#storyList'), stories);
}

function renderTactics(briefing) {
  const tactics = briefing.tactics ?? [];
  const section = $('#tactics');
  if (!tactics.length) {
    section.innerHTML = '';
    section.hidden = true;
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="section-rule"><span>TACTICS · FILM ROOM</span></div>
    <div class="tactics-heading">
      <div><span class="eyebrow">전략을 알면 경기가 다르게 보입니다</span><h2 id="tacticsTitle">오늘의 전술 교실</h2></div>
      <p>어려운 용어는 생활 속 비유로 풀고, 실제 경기에서 무엇을 보면 되는지까지 연결합니다.</p>
    </div>
    <div class="tactic-list">
      ${tactics.map((item) => {
        const breakdown = item.breakdown ?? [{ label: '경기에서 볼 것', text: item.gameUse }];
        const watchOrder = item.watchOrder ?? [item.gameUse];
        const source = item.source ?? { label: item.videoTitle, url: item.url };
        return `
        <article class="tactic-card">
          <header class="tactic-card-header">
            <span class="story-label">${h(item.label)}</span>
            <h3>${h(plainTitle(item.title))}</h3>
            <p class="tactic-trigger"><strong>관전 포인트</strong> ${h(shortExtract(item.watchOrder?.[0] || item.gameUse))}</p>
          </header>
          <div class="diagram-lesson">
            <figure class="tactic-figure">
              ${renderTacticDiagram(item)}
              <figcaption>${h(item.diagram?.caption ?? '과거 디자인 샘플: 실제 플레이 배치가 연결되지 않은 개념 카드입니다.')}</figcaption>
            </figure></div>
          <details class="tactic-deep"><summary>플레이 순서와 깊은 설명 펼치기</summary><p class="evidence-note">개념 도식과 관전 제안입니다. 특정 영상의 장면 분석은 아닙니다.</p><div class="diagram-lesson">
            <div class="play-steps">
              <span class="eyebrow">PLAY, STEP BY STEP</span>
              <h4>플레이가 이렇게 진행돼</h4>
              <ol>${breakdown.map((step) => `<li><span>${h(step.label)}</span><p>${h(step.text)}</p></li>`).join('')}</ol>
            </div>
          </div>
          <div class="teaching-grid">
            <section><span>전술 개념</span><p>${h(item.concept)}</p></section>
            <section><span>쉽게 말하면</span><p>${h(item.easy)}</p></section>
            <section><span>왜 통하는가</span><p>${h(item.whyItWorks ?? item.concept)}</p></section>
            <section><span>수비의 대응</span><p>${h(item.defenseCounter ?? '실제 경기 사례와 함께 보강할 예정인 과거 디자인 샘플입니다.')}</p></section>
            <section class="watch-sequence"><span>중계에서 보는 순서</span><ol>${watchOrder.map((point) => `<li>${h(point)}</li>`).join('')}</ol></section>
          </div>
          <footer class="tactic-source"><span>설명 근거</span><a href="${h(safeHttpsUrl(source.url))}" target="_blank" rel="noreferrer">${h(source.label)} ↗</a><p>관련 자료입니다. 링크 존재가 개별 장면의 검증을 뜻하지는 않습니다.</p></footer>
          </details>${item.video?.url ? `<a class="film-link" href="${h(safeHttpsUrl(item.video.url))}" target="_blank" rel="noreferrer"><span>▶</span><div><strong>${h(plainTitle(item.video.title))}</strong><small>${h(item.video.type)}</small></div></a>` : ''}
        </article>`;
      }).join('')}
    </div>`;
}

function renderHighlights(briefing) {
  const section = $('#highlights');
  if (!briefing.highlights.length) {
    section.innerHTML = '';
    section.hidden = true;
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="section-rule"><span>WATCH THE FILM</span></div>
    <h2 id="highlightsTitle">오늘 볼 하이라이트</h2>
    <div class="video-grid">
      ${briefing.highlights.map((video) => `
        <a class="video-card" href="${h(safeHttpsUrl(video.url))}" target="_blank" rel="noreferrer">
          <div class="video-poster"><span class="play">▶</span><small>${h(video.type)}</small></div>
          <div><span class="story-label">${h(video.channel)}</span><h3>${h(plainTitle(video.title))}</h3><p>${h(video.note)}</p></div>
        </a>
      `).join('')}
    </div>`;
}

function renderSchedule(briefing) {
  $('#scheduleBoard').innerHTML = `
    <div class="section-rule"><span>SELECTED GAMES</span></div>
    <div class="board-heading"><div><h2>주요 경기 보드</h2><p>선별한 경기 · 한국시간(KST)</p></div></div>
    <div id="scheduleList">${briefing.schedule
      .map((item) => {
        const date = item.date ?? item.time;
        const weekday = item.weekday ?? '';
        const time = item.date ? item.time : '';
        const status = item.status ?? '경기 예정';
        return `<div class="schedule-item"><time><strong>${h(date)}</strong><span>${h(weekday)}</span>${time ? `<b>${h(time)}</b>` : ''}</time><div><small class="game-status">${h(status)}</small><strong>${h(item.matchup)}</strong><details><summary>관전 제안</summary><p>${h(item.note)}</p></details></div></div>`;
      })
      .join('')}</div>`;
}

function bindLeagueButtons(container, items) {
  container.querySelectorAll('[data-league-index]').forEach(button => {
    button.addEventListener('click', () => {
      const item = items[Number(button.dataset.leagueIndex)];
      showDetailSheet({
        header: '리그 뉴스 전체 해설', label: item.label, title: item.title,
        blocks: [{label: '보도 내용·해석(기존 혼합 문안)', text: item.why}],
        sources: [{label: '출처 원문', url: item.url}],
      });
    });
  });
}

function renderLeagueWide(briefing) {
  const items = briefing.leagueWide ?? [];
  const section = $('#leagueWide');
  const leagueStories = briefing.sections.filter(story => story.team === 'NFL');
  if (!items.length && !leagueStories.length) {
    section.hidden = true;
    section.innerHTML = '';
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="section-rule"><span>AROUND THE LEAGUE</span></div>
    <h2>리그 뉴스</h2>
    <p class="league-wide-dek">팀 필터와 관계없이 보는 리그 소식</p>
    ${leagueStories.map(storyCard).join('')}<div class="quick-hit-list">
      ${items.map((item, index) => `<article class="quick-hit"><button class="story-card-button" data-league-index="${index}"><span>${h(item.label)}</span><h3>${h(plainTitle(item.title))}</h3>${takeaway(item)}<small>보도 내용·해석 읽기 →</small></button><a href="${h(safeHttpsUrl(item.url))}" target="_blank" rel="noreferrer">출처 원문 ↗</a></article>`).join('')}
    </div>`;
  bindStoryButtons(section, leagueStories);
  bindLeagueButtons(section, items);
}

function render() {
  const briefing = briefingForDate(currentDate, briefings);
  renderDates();
  $('#demoNotice').hidden = briefing.sample === false;
  $('#editionMeta').innerHTML = `<span>${h(briefing.edition.replace('검증 발행본', '일일 브리핑'))}</span><time>${h(briefing.date.replaceAll('-', '.'))} · ${h(briefing.weekday)}</time>`;
  $('#editionTitle').textContent = `${formatDate(briefing.date)} NFL 브리핑`;
  $('#editionDek').textContent = briefing.dek;
  $('#editionShare').setAttribute('href', `./editions/${briefing.date}/`);
  renderRoundup(briefing);
  renderStories(briefing);
  renderTactics(briefing);
  renderHighlights(briefing);
  renderSchedule(briefing);
  renderLeagueWide(briefing);

  document.querySelectorAll('.filter').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === currentFilter);
  });
  document.title = `${formatDate(briefing.date)} NFL 브리핑`;
}

$('#archiveSelect').addEventListener('change', event => changeDate(event.target.value));
$('#datePicker').addEventListener('change', (event) => changeDate(event.target.value));
$('#storySheetClose').addEventListener('click', closeStorySheet);
storySheet.addEventListener('click', (event) => {
  if (event.target === storySheet) closeStorySheet();
});
storySheet.addEventListener('cancel', event => { event.preventDefault(); closeStorySheet(); });
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const date = normalizeDateParam(urlParams.get('date'), briefings);
  const filter = ['49ers', 'Chiefs', 'Patriots'].includes(urlParams.get('team')) ? urlParams.get('team') : 'all';
  if (date !== currentDate || filter !== currentFilter) {
    currentDate = date;
    currentFilter = filter;
    render();
  }
  if (window.history.state?.detail) showDetailSheet(window.history.state.detail, true);
  else if (storySheet.open) storySheet.close();
});
storySheet.addEventListener('close', () => {
  document.body.classList.remove('sheet-open');
  sheetTrigger?.focus({preventScroll: true});
  window.scrollTo({top: sheetScroll, behavior: 'instant'});
});
document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    setUrl();
    render();
  });
});

render();
