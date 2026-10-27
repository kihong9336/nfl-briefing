// Static HTML is deliberately independent of the interactive app and its JavaScript.
import { renderIntegratedTactic } from './tactic-reading-flow.js';
export const SITE_BASE = 'https://kihong9336.github.io/nfl-briefing/';
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const labels = { summary: '요약', commentary: '해설', watch: '관전 포인트', concept: '개념', easy: '쉽게 이해하기', gameUse: '경기에서 보기', whyItWorks: '작동 원리', defenseCounter: '수비의 대응', breakdown: '단계별 해설', watchOrder: '관찰 순서', sources: '출처', source: '출처', diagram: '전술 도해 설명', caption: '설명', video: '관련 영상', videoTitle: '영상 제목', videoType: '영상 유형', channel: '채널', type: '유형', note: '참고', why: '의미', date: '날짜', weekday: '요일', time: '시각 (KST)', status: '경기 상태', matchup: '매치업', publishedAt: '원문 발행 시각', update: '업데이트', evidence: '근거', takeaway: '핵심 정리', weeklyQuestion: '이번 주 질문' };
function safeLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function content(value, key = '') {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return `<ul>${value.map((item) => `<li>${content(item)}</li>`).join('')}</ul>`;
  if (typeof value === 'object') return `<dl>${Object.entries(value).filter(([name]) => name !== 'id' && name !== 'kind').map(([name, item]) => `<dt>${escape(labels[name] ?? name)}</dt><dd>${content(item, name)}</dd>`).join('')}</dl>`;
  if (key === 'url' || key === 'evidence') {
    const href = safeLink(value);
    return href ? `<a href="${escape(href)}" rel="noopener noreferrer">${escape(value)}</a>` : escape(value);
  }
  return `<p>${escape(value)}</p>`;
}
function document(title, description, canonical, body, date) {
  const image = `${SITE_BASE}assets/icons/icon-512.png`;
  return `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}">
<link rel="canonical" href="${escape(canonical)}">
<meta property="og:type" content="${date ? 'article' : 'website'}"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="NFL 브리핑">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="NFL 브리핑 앱 아이콘"><meta property="og:image:width" content="512"><meta property="og:image:height" content="512">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}">
<style>body{font:17px/1.8 system-ui,sans-serif;max-width:850px;margin:auto;padding:24px;color:#172132;background:#faf9f6}a{color:#174c9c;overflow-wrap:anywhere}h1,h2,h3{line-height:1.35}article,section{margin:2rem 0;border-top:1px solid #ccd2db;padding-top:1rem}dt{font-weight:700}dd{margin:0 0 1rem 1rem}p{white-space:pre-wrap}nav{display:flex;gap:1rem;flex-wrap:wrap}aside{padding:1rem;border:2px solid #a15d00}ul{padding-left:1.4rem}</style></head>
<body>${body}${date ? `<link rel="stylesheet" href="../../src/nfl-chat.css?v=20261027-gemini"><script type="module">import { createNflChat } from '../../src/nfl-chat.js?v=20261027-gemini'; createNflChat(document.querySelector('#nflChat')).setDate('${date}');</script>` : ''}</body></html>\n`;
}
function renderEdition(edition) {
  const sample = edition.sample === true || /샘플|sample/i.test(edition.edition ?? '');
  const title = `${edition.date} · ${sample ? '[샘플] ' : ''}${edition.lead.title} | NFL 브리핑`;
  const description = `${edition.date} · ${sample ? '디자인 샘플 — 실제 뉴스 발행본이 아닙니다. ' : ''}${edition.dek}`;
  const sections = [['sections', '뉴스와 해설'], ['tactics', '전술 노트'], ['highlights', '하이라이트'], ['schedule', '경기 일정 · KST'], ['leagueWide', '리그 전체 소식']];
  const body = `<header><nav aria-label="브리핑 탐색"><a href="${SITE_BASE}?date=${edition.date}">이 날짜를 앱에서 읽기</a><a href="${SITE_BASE}editions/">전체 아카이브</a></nav><p><time datetime="${edition.date}">${edition.date}</time> ${escape(edition.weekday)} · ${escape(edition.edition)}</p><h1>${escape(edition.lead.title)}</h1><p>${escape(edition.dek)}</p></header>
${sample ? '<aside data-sample-warning="true"><strong>디자인 샘플</strong> — 실제 뉴스 발행본이 아닙니다. 아래 내용은 화면 구성 예시입니다.</aside>' : ''}
<main><section aria-label="오늘의 핵심"><h2>${escape(edition.lead.kicker)}</h2><p>${escape(edition.lead.summary)}</p></section>
${sections.map(([key, label]) => `<section><h2>${label}</h2>${(edition[key] ?? []).map((item) => key === 'tactics' && item.narrativeMode === 'integrated' ? renderIntegratedTactic(item) : `<article><h3>${escape(item.title ?? item.matchup ?? label)}</h3>${content(Object.fromEntries(Object.entries(item).filter(([name]) => name !== 'title')))}</article>`).join('') || '<p>등록된 항목이 없습니다.</p>'}</section>`).join('\n')}
${['takeaway', 'weeklyQuestion'].filter((key) => edition[key] !== undefined).map((key) => `<section><h2>${labels[key]}</h2>${content(edition[key])}</section>`).join('')}<section id="nflChat" aria-labelledby="nflChatTitle"></section></main><footer><p>이 문서는 ${edition.date} 발행분의 원문 보관본입니다. 내용과 경기 상태는 해당 발행 시점 기준이며 자동 재검증되지 않습니다.</p><a href="${SITE_BASE}">최신 브리핑</a></footer>`;
  return document(title, description, `${SITE_BASE}editions/${edition.date}/`, body, edition.date);
}
export function generateStaticPages(briefings) {
  const pages = {};
  const dates = new Set();
  for (const edition of briefings) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(edition.date) || !Number.isFinite(Date.parse(edition.date)) || new Date(edition.date).toISOString().slice(0, 10) !== edition.date) throw new Error('Invalid edition date');
    if (dates.has(edition.date)) throw new Error(`duplicate edition date: ${edition.date}`);
    dates.add(edition.date);
  }
  const groups = new Map();
  for (const edition of [...briefings].sort((a, b) => b.date.localeCompare(a.date))) {
    pages[`editions/${edition.date}/index.html`] = renderEdition(edition);
    const match = String(edition.edition ?? '').match(/(\d{4})\s+WEEK\s+(\d+)/i);
    const season = edition.season ?? match?.[1];
    const week = edition.week ?? match?.[2];
    const sample = edition.sample === true || /샘플|sample/i.test(edition.edition ?? '');
    const group = season && week ? `${season} 시즌 · WEEK ${week}` : `${sample ? '샘플 · ' : ''}시즌/주차 미지정`;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(`<li><a href="${SITE_BASE}editions/${edition.date}/"><time datetime="${edition.date}">${edition.date}</time> · ${escape(edition.lead.title)}</a> — ${escape(edition.edition)}${sample ? ' (샘플)' : ''}</li>`);
  }
  const body = `<header><a href="${SITE_BASE}">최신 브리핑 앱</a><h1>NFL 브리핑 아카이브</h1><p>발행분의 시즌·주차 표기를 기준으로 묶었습니다. 표기가 없는 날짜의 주차는 추정하지 않습니다.</p></header><main>${[...groups].map(([group, entries]) => `<section><h2>${escape(group)}</h2><ul>${entries.join('')}</ul></section>`).join('')}</main>`;
  pages['editions/index.html'] = document('NFL 브리핑 · 날짜별 아카이브', '시즌과 주차별로 읽는 NFL 브리핑 원문 보관본', `${SITE_BASE}editions/`, body);
  return pages;
}
