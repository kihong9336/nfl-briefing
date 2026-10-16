function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function player(x, y, label, side = 'offense', size = 22) {
  return `<g class="diagram-player ${side}" transform="translate(${x} ${y})"><circle r="${size}"/><text text-anchor="middle" dominant-baseline="central">${label}</text></g>`;
}

function blitzHotRead(item) {
  return `
    <svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="blitz-title blitz-desc">
      <title id="blitz-title">${escapeXml(item.title)}</title>
      <desc id="blitz-desc">라인배커의 블리츠로 비워진 왼쪽 훅 지역에 슬롯 리시버가 핫 리드로 들어가고 쿼터백이 빠르게 던지는 장면</desc>
      <defs>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#ff5b68" d="M 0 0 L 10 5 L 0 10 z"/></marker>
        <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#ffd54a" d="M 0 0 L 10 5 L 0 10 z"/></marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#78c8ff" d="M 0 0 L 10 5 L 0 10 z"/></marker>
      </defs>
      <rect class="field-bg" x="0" y="0" width="720" height="430" rx="12"/>
      <g class="yard-lines"><path d="M0 80H720M0 155H720M0 230H720M0 305H720M120 0V430M240 0V430M360 0V430M480 0V430M600 0V430"/></g>
      <path class="line-scrimmage" d="M18 230H702"/><text class="field-label" x="24" y="220">LINE OF SCRIMMAGE</text>
      <ellipse class="vacated-zone" cx="195" cy="205" rx="76" ry="55"/><text class="callout light" x="128" y="132">② 비는 공간</text>

      ${player(80, 305, 'WR')}${player(180, 292, 'SL')}${player(270, 270, 'OL', 'offense', 18)}${player(315, 270, 'OL', 'offense', 18)}${player(360, 270, 'C', 'offense', 18)}${player(405, 270, 'OL', 'offense', 18)}${player(450, 270, 'OL', 'offense', 18)}${player(520, 270, 'TE')}${player(640, 305, 'WR')}${player(360, 345, 'QB')}${player(445, 350, 'RB')}

      ${player(292, 196, 'D', 'defense', 18)}${player(337, 196, 'D', 'defense', 18)}${player(382, 196, 'D', 'defense', 18)}${player(427, 196, 'D', 'defense', 18)}${player(215, 150, 'LB', 'defense')}${player(500, 150, 'LB', 'defense')}${player(105, 190, 'CB', 'defense', 19)}${player(610, 190, 'CB', 'defense', 19)}${player(175, 210, 'N', 'defense', 18)}${player(285, 75, 'S', 'defense', 19)}${player(455, 75, 'S', 'defense', 19)}

      <path class="pressure-path" d="M215 174 C235 205 275 230 315 292" marker-end="url(#arrow-red)"/><text class="callout danger" x="112" y="96">① 추가 러셔 블리츠</text>
      <path class="drop-path" d="M500 128 C520 105 540 98 570 100" marker-end="url(#arrow-blue)"/><text class="mini-label" x="455" y="83">위장 후 커버 드롭</text>
      <path class="route-path" d="M180 268 C190 245 212 222 242 205" marker-end="url(#arrow-yellow)"/>
      <path class="pass-path" d="M350 330 Q290 255 242 205" marker-end="url(#arrow-yellow)"/>
      <text class="callout accent" x="250" y="175">③ 핫 리드</text>
      <g class="diagram-legend" transform="translate(24 390)"><text>빨강: 압박</text><text x="130">노랑: 리시버·패스</text><text x="315">점선 영역: 압박으로 비는 공간</text></g>
    </svg>`;
}

function backShoulder(item) {
  return `
    <svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="shoulder-title shoulder-desc">
      <title id="shoulder-title">${escapeXml(item.title)}</title>
      <desc id="shoulder-desc">사이드라인을 따라 깊게 달리는 리시버와 코너백의 진행 방향 반대편에 쿼터백이 공을 배치하고 리시버가 급정지해 잡는 장면</desc>
      <defs>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#ff5b68" d="M 0 0 L 10 5 L 0 10 z"/></marker>
        <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#ffd54a" d="M 0 0 L 10 5 L 0 10 z"/></marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path fill="#78c8ff" d="M 0 0 L 10 5 L 0 10 z"/></marker>
      </defs>
      <rect class="field-bg" x="0" y="0" width="720" height="430" rx="12"/>
      <g class="yard-lines"><path d="M0 80H720M0 155H720M0 230H720M0 305H720M120 0V430M240 0V430M360 0V430M480 0V430M600 0V430"/></g>
      <path class="sideline" d="M662 15V415"/><text class="field-label vertical" x="652" y="232">사이드라인</text>
      <path class="line-scrimmage" d="M18 318H662"/><text class="field-label" x="24" y="308">LINE OF SCRIMMAGE</text>

      ${player(265, 372, 'QB')}${player(340, 338, 'RB', 'offense', 18)}${player(180, 332, 'OL', 'offense', 18)}${player(225, 332, 'OL', 'offense', 18)}${player(270, 332, 'C', 'offense', 18)}${player(315, 332, 'OL', 'offense', 18)}${player(360, 332, 'OL', 'offense', 18)}${player(610, 300, 'WR')}
      ${player(595, 254, 'CB', 'defense')}${player(455, 105, 'S', 'defense', 20)}

      <path class="route-stem" d="M610 276 C610 230 608 176 606 120" marker-end="url(#arrow-blue)"/>
      <text class="mini-label" x="430" y="148">① 깊은 패스 위협</text>
      <path class="pressure-path" d="M595 230 C595 190 594 150 593 105" marker-end="url(#arrow-red)"/><text class="callout danger" x="355" y="78">② CB 진행 방향</text>
      <path class="wr-break" d="M606 120 Q630 135 626 170" marker-end="url(#arrow-yellow)"/><text class="callout accent" x="385" y="198">④ WR 브레이크</text>
      <path class="pass-path" d="M280 360 Q470 245 626 170" marker-end="url(#arrow-yellow)"/>
      <circle class="catch-point" cx="626" cy="170" r="13"/><text class="callout light" x="340" y="232">③ 캐치 지점: 뒤쪽 어깨</text>
      <path class="safety-help" d="M455 128 Q505 150 535 185" marker-end="url(#arrow-blue)"/><text class="mini-label" x="300" y="145">세이프티 도움은 안쪽</text>
      <g class="diagram-legend" transform="translate(24 390)"><text>파랑: 깊은 진행</text><text x="140">빨강: CB의 관성</text><text x="285">노랑: 공·리시버의 방향 전환</text></g>
    </svg>`;
}

export function renderTacticDiagram(item) {
  if (item?.diagram?.kind === 'blitz-hot-read') return blitzHotRead(item);
  if (item?.diagram?.kind === 'back-shoulder') return backShoulder(item);
  return `<div class="diagram-fallback">이 전술의 전용 다이어그램을 준비 중입니다.</div>`;
}
