import { briefings } from './data.js';
import {
  availableDates,
  briefingForDate,
  filterSections,
  filterTactics,
  neighboringDates,
  normalizeDateParam,
} from './briefing.js';

const $ = (selector) => document.querySelector(selector);
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
    .map((date) => `<button class="date-chip ${date === currentDate ? 'is-active' : ''}" data-date="${date}"><span>${formatDate(date)}</span><small>${briefingForDate(date, briefings).weekday}</small></button>`)
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
    .map((story, index) => `
      <article class="story ${story.team !== 'NFL' ? `story-${story.team.toLowerCase()}` : ''}">
        <div class="story-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="story-body">
          <span class="story-label">${story.label}</span>
          <h2>${story.title}</h2>
          <p class="fact"><strong>핵심 요약</strong>${story.summary}</p>
          <div class="analysis"><strong>꿀봉의 해설</strong><p>${story.commentary}</p></div>
          <p class="watch"><span>WATCH</span>${story.watch}</p>
        </div>
      </article>
    `)
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
      ${tactics.map((item, index) => `
        <article class="tactic-card">
          <div class="tactic-diagram" aria-hidden="true">
            <span class="field-line line-one"></span><span class="field-line line-two"></span>
            <i class="player offense p1">O</i><i class="player offense p2">O</i><i class="player offense p3">O</i>
            <i class="player defense d1">D</i><i class="player defense d2">D</i>
            <span class="route route-${(index % 3) + 1}"></span>
          </div>
          <div class="tactic-copy">
            <span class="story-label">${item.label}</span>
            <h3>${item.title}</h3>
            <dl>
              <div><dt>전술의 뜻</dt><dd>${item.concept}</dd></div>
              <div><dt>쉽게 말하면</dt><dd>${item.easy}</dd></div>
              <div><dt>경기에서 볼 것</dt><dd>${item.gameUse}</dd></div>
            </dl>
            <a class="film-link" href="${item.url}" target="_blank" rel="noreferrer"><span>▶</span><div><strong>${item.videoTitle}</strong><small>${item.videoType}</small></div></a>
          </div>
        </article>
      `).join('')}
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
        <a class="video-card" href="${video.url}" target="_blank" rel="noreferrer">
          <div class="video-poster"><span class="play">▶</span><small>${video.type}</small></div>
          <div><span class="story-label">${video.channel}</span><h3>${video.title}</h3><p>${video.note}</p></div>
        </a>
      `).join('')}
    </div>`;
}

function renderSchedule(briefing) {
  $('#scheduleList').innerHTML = briefing.schedule
    .map((item) => `<div class="schedule-item"><time>${item.time}</time><div><strong>${item.matchup}</strong><span>${item.note}</span></div></div>`)
    .join('');
}

function render() {
  const briefing = briefingForDate(currentDate, briefings);
  renderDates();
  $('#editionMeta').innerHTML = `<span>${briefing.edition}</span><time>${briefing.date.replaceAll('-', '.')} · ${briefing.weekday}</time>`;
  $('#editionTitle').textContent = `${formatDate(briefing.date)} NFL 브리핑`;
  $('#editionDek').textContent = briefing.dek;
  $('#leadStory').innerHTML = `<span class="eyebrow">${briefing.lead.kicker}</span><h2 id="leadTitle">${briefing.lead.title}</h2><p>${briefing.lead.summary}</p>`;
  renderStories(briefing);
  renderTactics(briefing);
  renderHighlights(briefing);
  renderSchedule(briefing);

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
