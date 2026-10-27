import { escapeHtml as h } from './render-utils.js';

function row(game) {
  const date = game.date ?? game.time;
  const time = game.date ? game.time : '';
  return `<div class="schedule-row" data-schedule-game><time class="schedule-when"><strong>${h(date)}</strong> <span>${h(game.weekday ?? '')}</span>${time ? ` <b>${h(time)}</b>` : ''}</time><div class="schedule-game"><div class="schedule-line"><small class="schedule-status">${h(game.status ?? '경기 예정')}</small> <strong class="schedule-matchup">${h(game.matchup)}</strong></div><details class="schedule-note"><summary>관전 포인트</summary><p>${h(game.note ?? '')}</p></details></div></div>`;
}

// Pure presentation: neither the supplied list nor game records are changed.
export function renderScheduleBoard(games = []) {
  const priority = game => /진행\s*중|in[ -]?progress|^live$|하프타임/i.test(game.status ?? '') ? 0 : /\b(?:49ers|Chiefs|Patriots)\b/i.test(game.matchup ?? '') ? 1 : 2;
  const ordered = games.map((game, index) => ({game, index})).sort((a, b) => priority(a.game) - priority(b.game) || a.index - b.index);
  const preview = ordered.slice(0, 3).map(({game}) => game);
  const selected = new Set(ordered.slice(0, 3).map(({index}) => index));
  const remaining = games.filter((_, index) => !selected.has(index));
  return `<div class="schedule-compact compact-schedule"><div class="section-rule"><span>SELECTED GAMES</span></div><div class="board-heading"><div><h2>주요 경기 보드</h2><p>관심팀 우선 · 한국시간</p></div></div><div class="schedule-preview">${preview.map(row).join('')}</div>${remaining.length ? `<details class="schedule-more" data-schedule-overflow><summary><span class="schedule-show">전체 ${games.length}경기 보기 · 추가 ${remaining.length}경기</span><span class="schedule-hide">추가 경기 접기 · 전체 ${games.length}경기</span></summary><div class="schedule-remaining">${remaining.map(row).join('')}</div></details>` : ''}${games.length ? '' : '<p>등록된 경기가 없습니다.</p>'}</div>`;
}
