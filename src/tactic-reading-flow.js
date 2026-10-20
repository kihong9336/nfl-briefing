import { escapeHtml as h, safeHttpsUrl } from './render-utils.js';
import { renderTacticDiagram } from './tactic-visuals.js';

// One readable narrative shared by the app and the JavaScript-free archive.
export function renderIntegratedTactic(item) {
  const intro = [...new Set([item.concept, item.easy].filter(Boolean))].join(' ');
  const steps = item.breakdown ?? [{ label: '경기에서 볼 것', text: item.gameUse }];
  const source = item.source ?? { label: item.videoTitle, url: item.url };
  const watch = item.watchOrder ?? (item.gameUse ? [item.gameUse] : []);
  const references = [...new Set([item.whyItWorks ?? item.whyWorks, item.defenseCounter ?? item.counter, item.diagram?.caption, watch.includes(item.gameUse) ? null : item.gameUse].filter(Boolean))];
  return `<article class="tactic-card" data-narrative-mode="integrated">
    <header class="tactic-card-header"><span class="story-label">${h(item.label)}</span><h3>${h(item.title)}</h3></header>
    ${intro ? `<section class="tactic-intro"><h4>장면 이해하기</h4><p>${h(intro)}</p></section>` : ''}
    ${item.video?.url ? `<a class="film-link" href="${h(safeHttpsUrl(item.video.url))}" target="_blank" rel="noreferrer"><span>▶</span><div><strong>${h(item.video.title || '이 플레이 영상 보기')}</strong>${item.video.type ? `<small>${h(item.video.type)}</small>` : ''}</div></a>` : ''}
    <div class="play-steps"><span class="eyebrow">PLAY, STEP BY STEP</span><h4>플레이가 이렇게 진행돼</h4><ol>${steps.map(step => `<li><span>${h(step.label)}</span><p>${h(step.text)}</p>${step.meaning ? `<p><strong>이 장면의 원리</strong> ${h(step.meaning)}</p>` : ''}${step.counter ? `<p><strong>수비의 선택</strong> ${h(step.counter)}</p>` : ''}</li>`).join('')}</ol></div>
    <figure class="tactic-figure">${renderTacticDiagram(item)}<figcaption>개념도는 실제 정렬 재현이 아닙니다.</figcaption></figure>
    ${watch.length ? `<section class="watch-sequence"><h4>중계에서 보는 순서</h4><ol>${watch.map(point => `<li>${h(point)}</li>`).join('')}</ol></section>` : ''}
    ${references.length ? `<details class="tactic-reference"><summary>참고 설명</summary>${references.map(text => `<p>${h(text)}</p>`).join('')}</details>` : ''}
    <footer class="tactic-source"><span>설명 근거</span><a href="${h(safeHttpsUrl(source.url))}" target="_blank" rel="noreferrer">${h(source.label)} ↗</a></footer>
  </article>`;
}
