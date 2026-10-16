import { briefings } from './data.js';
import {
  availableDates,
  briefingForDate,
  filterSections,
  filterTactics,
  neighboringDates,
  normalizeDateParam,
} from './briefing.js';
import { escapeHtml, safeHttpsUrl } from './render-utils.js';
import { renderTacticDiagram } from './tactic-visuals.js';

const $ = (selector) => document.querySelector(selector);
const h = escapeHtml;
const params = new URLSearchParams(window.location.search);
let currentDate = normalizeDateParam(params.get('date'), briefings);
let currentFilter = params.get('team') || 'all';

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
  window.history.replaceState({}, '', next);
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

  const neighbors = neighboringDates(currentDate, briefings);
  $('#olderButton').disabled = !neighbors.older;
  $('#newerButton').disabled = !neighbors.newer;
  $('#olderButton').onclick = () => neighbors.older && changeDate(neighbors.older);
  $('#newerButton').onclick = () => neighbors.newer && changeDate(neighbors.newer);
  $('#datePicker').value = currentDate;
}

function renderStories(briefing) {
  const sections = filterSections(briefing.sections, currentFilter);
  $('#storyList').innerHTML = sections
    .map((story, index) => {
      const teamClass = ['49ers', 'Chiefs', 'Patriots'].includes(story.team) ? `story-${story.team.toLowerCase()}` : '';
      return `
      <article class="story ${teamClass}">
        <div class="story-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="story-body">
          <span class="story-label">${h(story.label)}</span>
          <h2>${h(story.title)}</h2>
          <p class="fact"><strong>핵심 요약</strong>${h(story.summary)}</p>
          <div class="analysis"><strong>꿀봉의 해설</strong><p>${h(story.commentary)}</p></div>
          <p class="watch"><span>WATCH</span>${h(story.watch)}</p>
          <div class="story-sources" aria-label="기사 출처">
            ${(story.sources ?? []).map((source) => `<a href="${h(safeHttpsUrl(source.url))}" target="_blank" rel="noreferrer">↗ ${h(source.label)}</a>`).join('')}
          </div>
        </div>
      </article>`;
    })
    .join('');
}

function renderTactics(briefing) {
  const tactics = filterTactics(briefing.tactics ?? [], currentFilter);
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
            <h3>${h(item.title)}</h3>
            <p>${h(item.concept)}</p>
          </header>
          <div class="diagram-lesson">
            <figure class="tactic-figure">
              ${renderTacticDiagram(item)}
              <figcaption>${h(item.diagram?.caption ?? '과거 디자인 샘플: 실제 플레이 배치가 연결되지 않은 개념 카드입니다.')}</figcaption>
            </figure>
            <div class="play-steps">
              <span class="eyebrow">PLAY, STEP BY STEP</span>
              <h4>플레이가 이렇게 진행돼</h4>
              <ol>${breakdown.map((step) => `<li><span>${h(step.label)}</span><p>${h(step.text)}</p></li>`).join('')}</ol>
            </div>
          </div>
          <div class="teaching-grid">
            <section><span>쉽게 말하면</span><p>${h(item.easy)}</p></section>
            <section><span>왜 통하는가</span><p>${h(item.whyItWorks ?? item.concept)}</p></section>
            <section><span>수비의 대응</span><p>${h(item.defenseCounter ?? '실제 경기 사례와 함께 보강할 예정인 과거 디자인 샘플입니다.')}</p></section>
            <section class="watch-sequence"><span>중계에서 보는 순서</span><ol>${watchOrder.map((point) => `<li>${h(point)}</li>`).join('')}</ol></section>
          </div>
          <footer class="tactic-source"><span>설명 근거</span><a href="${h(safeHttpsUrl(source.url))}" target="_blank" rel="noreferrer">${h(source.label)} ↗</a><p>링크를 읽어야 이해되는 구조가 아니라, 위 설명을 검증할 수 있는 원문입니다.</p></footer>
          ${item.video?.url ? `<a class="film-link" href="${h(safeHttpsUrl(item.video.url))}" target="_blank" rel="noreferrer"><span>▶</span><div><strong>${h(item.video.title)}</strong><small>${h(item.video.type)}</small></div></a>` : ''}
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
          <div><span class="story-label">${h(video.channel)}</span><h3>${h(video.title)}</h3><p>${h(video.note)}</p></div>
        </a>
      `).join('')}
    </div>`;
}

function renderSchedule(briefing) {
  $('#scheduleBoard').innerHTML = `
    <div class="section-rule"><span>UPCOMING GAMES</span></div>
    <div class="board-heading"><div><h2>다가오는 경기 일정</h2><p>모든 시간 KST · 한국시간</p></div></div>
    <div id="scheduleList">${briefing.schedule
      .map((item) => {
        const date = item.date ?? item.time;
        const weekday = item.weekday ?? '';
        const time = item.date ? item.time : '';
        const status = item.status ?? '경기 예정';
        return `<div class="schedule-item"><time><strong>${h(date)}</strong><span>${h(weekday)}</span>${time ? `<b>${h(time)}</b>` : ''}</time><div><small class="game-status">${h(status)}</small><strong>${h(item.matchup)}</strong><span>${h(item.note)}</span></div></div>`;
      })
      .join('')}</div>`;
}

function renderLeagueWide(briefing) {
  const items = briefing.leagueWide ?? [];
  const section = $('#leagueWide');
  if (!items.length) {
    section.hidden = true;
    section.innerHTML = '';
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="section-rule"><span>AROUND THE LEAGUE</span></div>
    <h2>리그 와이드</h2>
    <p class="league-wide-dek">주력 세 팀 밖에서 오늘 놓치면 아쉬운 뉴스</p>
    <div class="quick-hit-list">
      ${items.map((item) => `<a class="quick-hit" href="${h(safeHttpsUrl(item.url))}" target="_blank" rel="noreferrer"><span>${h(item.label)}</span><strong>${h(item.title)}</strong><p>${h(item.why)}</p><small>공식 원문 ↗</small></a>`).join('')}
    </div>`;
}

function render() {
  const briefing = briefingForDate(currentDate, briefings);
  renderDates();
  $('#demoNotice').hidden = briefing.sample === false;
  $('#editionMeta').innerHTML = `<span>${h(briefing.edition)}</span><time>${h(briefing.date.replaceAll('-', '.'))} · ${h(briefing.weekday)}</time>`;
  $('#editionTitle').textContent = `${formatDate(briefing.date)} NFL 브리핑`;
  $('#editionDek').textContent = briefing.dek;
  $('#leadStory').innerHTML = `<span class="eyebrow">${h(briefing.lead.kicker)}</span><h2 id="leadTitle">${h(briefing.lead.title)}</h2><p>${h(briefing.lead.summary)}</p>`;
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

$('#datePicker').addEventListener('change', (event) => changeDate(event.target.value));
document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    setUrl();
    render();
  });
});

render();
