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

function hookAndLadder(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="ladder-title ladder-desc">
    <title id="ladder-title">${escapeXml(item.title)}</title>
    <desc id="ladder-desc">개념도: 실제 선수 위치·플레이 필름 재현 아님. 공격은 위쪽. QB의 짧은 전방 패스를 WR이 받고 뒤따르는 RB에게 후방 래터럴, RB가 전진해 갱신선 통과.</desc>
    <defs><marker id="ladder-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="mini-label" x="24" y="30">개념도 · 실제 선수 위치·플레이 필름 재현 아님</text>
    <text class="field-label" x="24" y="65">3rd &amp; 11 · 공격 방향 ↑ · 거리 비례 아님</text>
    <path class="line-scrimmage" d="M18 290H702"/><text class="field-label" x="24" y="280">LINE OF SCRIMMAGE</text>
    <path class="route-path" d="M18 140H702"/><text class="field-label" x="420" y="130">LINE TO GAIN · 11yd</text>
    <path data-action="forward-pass" class="pass-path" d="M360 330 L220 210" marker-end="url(#ladder-arrow)"/>
    <path data-action="backward-lateral" class="pass-path" d="M220 210 L320 245" marker-end="url(#ladder-arrow)"/>
    <path data-action="advance" class="route-path" d="M320 245 L390 110" marker-end="url(#ladder-arrow)"/>
    ${player(360, 350, 'QB')}${player(200, 195, 'WR')}${player(320, 265, 'RB')}
    <text class="mini-label" x="60" y="335">① 짧은 전방 패스</text>
    <text class="mini-label" x="45" y="245">② 후방 래터럴</text>
    <text class="mini-label" x="420" y="205">③ RB 전진 · 갱신선 통과</text>
    <text class="mini-label" x="24" y="395">래터럴은 전방이 아닌 뒤쪽으로 · RB는 WR 뒤를 따라 받음</text>
  </svg>`;
}

function fourthDownDbBlitz(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="db-title db-desc">
    <title id="db-title">${escapeXml(item.title)}</title>
    <desc id="db-desc">일반 배치 개념도: 실제 선수 위치·플레이 필름 재현 아님. 연장 4th and 8에서 DB가 QB를 압박해 스크리미지 라인 뒤에서 색. 실제 보호 방식·수비 프런트는 표시하지 않음.</desc>
    <defs><marker id="db-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ff5b68" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="mini-label" x="24" y="30">개념도 · 실제 선수 위치·플레이 필름 재현 아님</text>
    <text class="field-label" x="24" y="65">OT · 4th &amp; 8 · 공격 방향 ↑ · 거리 비례 아님</text>
    <path class="route-path" d="M18 140H702"/><text class="field-label" x="420" y="130">LINE TO GAIN · 8yd</text>
    <path class="line-scrimmage" d="M18 270H702"/><text class="field-label" x="420" y="260">LINE OF SCRIMMAGE</text>
    <path data-action="db-pressure" class="pressure-path" d="M180 220 Q240 300 340 330" marker-end="url(#db-arrow)"/>
    ${player(170, 200, 'DB', 'defense')}${player(360, 340, 'QB')}
    <text class="callout danger" x="230" y="205">DB 블리츠 → QB</text>
    <text class="callout light" x="420" y="345">SACK · 갱신 실패</text>
    <text class="mini-label" x="24" y="395">일반 배치만 표시 · 실제 보호 방식·수비 프런트 추정 없음</text>
  </svg>`;
}

function catchAndRun(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="run-title run-desc">
    <title id="run-title">${escapeXml(item.title)}</title>
    <desc id="run-desc">개념도: 짧은 패스로 공을 받은 러닝백이 리시버의 블록 옆으로 전진하는 원리. 실제 선수 배치나 거리 재현이 아니다.</desc>
    <defs><marker id="run-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="mini-label" x="24" y="30">짧은 패스 → 블록 → 캐치 후 전진 · 개념도</text>
    <text class="field-label" x="24" y="65">공격 방향 ↑</text>
    <path class="line-scrimmage" d="M18 290H702"/>
    <text class="field-label" x="24" y="280">출발선</text>
    <path data-action="short-pass" class="pass-path" d="M350 340 Q440 355 510 300" marker-end="url(#run-arrow)"/>
    <path data-action="run-after-catch" class="route-path" d="M530 280 Q610 240 600 110" marker-end="url(#run-arrow)"/>
    <path data-action="downfield-block" class="pressure-path" d="M470 220 L490 190"/>
    <path class="pressure-path" d="M478 180 L506 201"/>
    ${player(350,340,'QB')}${player(530,300,'RB')}${player(455,235,'WR')}${player(505,165,'D','defense')}
    <text class="callout accent" x="375" y="390">① 짧게 연결</text>
    <text class="callout light" x="205" y="205">② 리시버의 블록</text>
    <text class="callout accent" x="405" y="80">③ 열린 쪽으로 전진</text>
  </svg>`;
}

function doubleDig(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="dig-title dig-desc">
    <title id="dig-title">${escapeXml(item.title)}</title>
    <desc id="dig-desc">두 깊이의 안쪽 루트와 가운데 존 수비수를 읽는 관계도. 공격은 위쪽이며 노란 실선은 루트, 파란 점선은 수비 구역이다.</desc>
    <defs><marker id="dig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="30">스냅 전 압박 위장 → 스냅 후 존 · 공격 ↑</text>
    <g fill="#78c8ff" fill-opacity="0.12" stroke="#78c8ff" stroke-dasharray="7 5">
      <rect data-zone="deep-left" x="45" y="50" width="300" height="55" rx="15"/>
      <rect data-zone="deep-right" x="375" y="50" width="300" height="55" rx="15"/>
      <ellipse data-zone="middle" cx="480" cy="175" rx="95" ry="60"/>
    </g>
    <text class="mini-label" x="145" y="85">왼쪽 깊은 존</text>
    <text class="mini-label" x="470" y="85">오른쪽 깊은 존</text>
    <path class="line-scrimmage" d="M45 300H675"/>
    <path data-action="inside-dig" class="route-path" d="M230 320 V220 H430" marker-end="url(#dig-arrow)"/>
    <path data-action="outside-dig" class="route-path" d="M100 320 V140 H430" marker-end="url(#dig-arrow)"/>
    <path data-action="middle-zone-read" class="pass-path" d="M360 340 Q550 300 505 210" marker-end="url(#dig-arrow)"/>
    ${player(100,340,'WR')}${player(230,340,'WR')}${player(360,365,'QB')}${player(480,175,'D','defense')}
    <text class="mini-label" x="120" y="125">② 바깥 디그</text>
    <text class="mini-label" x="245" y="255">① 안쪽 디그</text>
    <text class="mini-label" x="580" y="180">가운데 존</text>
    <text class="mini-label" x="525" y="285">QB 읽기</text>
    <text class="mini-label" x="24" y="410">관계 개념도 · 실제 배치 재현 아님 · 거리 비례 아님</text>
  </svg>`;
}

function loopStunt(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="loop-title loop-desc">
    <title id="loop-title">${escapeXml(item.title)}</title>
    <desc id="loop-desc">개념도: Cashman이 오른쪽 태클로 접근한 뒤 반대쪽 LT와 LG 사이로 돌아오는 압박 경로. 실제 전체 정렬 재현이 아니다.</desc>
    <defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ff5b68" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="30">루프 압박 개념도 · 공격 방향 ↑</text>
    <text class="mini-label" x="24" y="65">① RT 접근 → ② 반대편 틈 → ③ QB 압박</text>
    <path class="line-scrimmage" d="M30 245H690"/>
    <rect data-zone="protection-handoff" x="249" y="228" width="42" height="72" rx="12" fill="#78c8ff" fill-opacity="0.18" stroke="#78c8ff" stroke-dasharray="5 4"/>
    <path data-action="initial-approach" class="pressure-path" d="M510 130 L510 215" stroke-dasharray="6 6" marker-end="url(#loop-arrow)"/>
    <path data-action="loop-pressure" class="pressure-path" d="M510 175 C460 125 270 125 270 215 L270 285 Q285 340 334 350" marker-end="url(#loop-arrow)"/>
    ${player(240,270,'LT')}${player(300,270,'LG')}${player(370,270,'C')}${player(440,270,'RG')}${player(510,270,'RT')}${player(360,355,'QB')}${player(510,105,'LB','defense')}
    <text class="mini-label" x="545" y="110">Cashman</text>
    <text class="mini-label" x="45" y="185">② 돌아오는 경로</text>
    <text class="mini-label" x="35" y="325">LT–LG 보호 인계</text>
    <text class="mini-label" x="420" y="355">③ 던질 시간 축소</text>
    <text class="mini-label" x="24" y="410">점선: 첫 접근 · 곡선: 실제 진입 방향 · 배치·거리 비례 아님</text>
  </svg>`;
}

function fourthDownClockDecision(item) {
  return `<section class="clock-decision" aria-label="${escapeXml(item.title)}" style="max-width:100%;min-width:0;overflow-wrap:anywhere">
    <p><strong>동점 · 4Q 4:53 · 4th &amp; 1</strong></p>
    <p>↓ 필드 위치와 다음 공격권을 함께 비교</p>
    <ol style="padding-inline-start:1.5em">
      <li><strong>펀트</strong><p>상대를 뒤로 보낼 수 있다. 하지만 상대가 시간을 쓰면 다음 공격권이 돌아오지 않을 수 있다.</p></li>
      <li><strong>시도 성공</strong><p>공격권을 유지하며 전진한다. 득점과 시간 사용을 계속 선택할 수 있다.</p></li>
      <li><strong>시도 실패</strong><p>상대에게 짧은 필드를 내준다. 다시 공을 받을 시간은 상대의 시간 관리와 득점 과정에 달려 있다.</p></li>
    </ol>
    <p>성공 확률·타임아웃도 함께 판단한다. 승리 결과만으로 선택의 우열을 확정하지 않는다.</p>
  </section>`;
}

function rbRotationOptions(item) {
  return `<section class="rb-rotation-options" aria-label="${escapeXml(item.title)}" style="max-width:100%;min-width:0;overflow-wrap:anywhere">
    <p><strong>Williams ↔ Corum</strong><br>교대해도 같은 공격 선택지</p>
    <p>↓ 공통 메뉴 ↓</p>
    <details open><summary>1 · 러닝백 교대</summary><p>Williams 또는 Corum이 들어온다. 선수 이름만으로 다음 플레이를 정하지 않는다.</p></details>
    <details open><summary>2 · 두 선수의 공통 메뉴</summary><p><strong>러닝 ↔ 패스 참여·보호</strong><br>누가 뛰어도 러닝과 패스 선택지를 남긴다. 모든 임무를 한 플레이에서 동시에 수행한다는 뜻은 아니다.</p></details>
    <details open><summary>3 · 수비의 책임</summary><p><strong>러닝 갭 ↔ 패스 커버</strong><br>수비는 교체 선수만 보고 단정하지 않고 다운·거리·정렬과 스냅 뒤 움직임을 읽는다.</p></details>
    <p>공격 선택지의 관계 개념도 · 실제 정렬이나 블로킹 재현 아님</p>
  </section>`;
}

function passTipInterception(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="tip-title tip-desc">
    <title id="tip-title">${escapeXml(item.title)}</title>
    <desc id="tip-desc">패스 길목에서 손으로 공을 굴절한 뒤 직접 포구하는 과정. 실제 정렬 재현 아님. 위로 튀는 공은 곡선으로 표현하며 거리 비례가 아니다.</desc>
    <defs><marker id="tip-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="mini-label" x="24" y="32">패스 → 굴절 → 포구 · 개념도</text>
    <path class="line-scrimmage" d="M24 255H696"/>
    <text class="field-label" x="24" y="245">LINE OF SCRIMMAGE</text>
    <path data-action="intended-pass" class="pass-path" d="M180 335 L365 255 L550 175" stroke-dasharray="8 7"/>
    <path data-action="deflection" class="route-path" d="M365 255 Q320 85 450 125 Q525 160 460 220" marker-end="url(#tip-arrow)"/>
    <circle class="catch-point" cx="365" cy="255" r="12"/>
    ${player(165,350,'QB')}${player(460,245,'LB','defense')}
    <text class="mini-label" x="24" y="305">① 패스</text>
    <text class="mini-label" x="215" y="205">② 손 접촉</text>
    <text class="mini-label" x="340" y="85">공이 위로 굴절</text>
    <text data-action="possession" class="mini-label" x="505" y="265">③ Hopper 포구</text>
    <text class="mini-label" x="24" y="390">④ 소유권 전환 → 다음 공격의 TD</text>
    <text class="field-label" x="24" y="417">점선: 원래 패스 경로 · 곡선: 굴절 뒤 공</text>
  </svg>`;
}

function scrambleDrillLevels(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="scramble-title scramble-desc" style="max-width:100%;height:auto">
    <title id="scramble-title">${escapeXml(item.title)}</title>
    <desc id="scramble-desc">스크램블 드릴 개념도. QB는 오른쪽으로 이동하고 Chism은 크로싱을 끊어 사이드라인으로 되돌아간다. 깊은·중간·짧은 표적 구역은 일반 원칙이며 실제 정렬 재현이 아니다.</desc>
    <defs>
      <marker id="scramble-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker>
      <marker id="scramble-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="#ff5b68" d="M0 0L10 5L0 10z"/></marker>
    </defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="30">스크램블 드릴 · 공격 ↑</text>
    <g fill="#78c8ff" fill-opacity="0.12" stroke="#78c8ff" stroke-dasharray="6 5">
      <rect data-depth="deep" x="510" y="50" width="175" height="50" rx="12"/>
      <rect data-depth="middle" x="510" y="120" width="175" height="50" rx="12"/>
      <rect data-depth="short" x="510" y="190" width="175" height="50" rx="12"/>
    </g>
    <text class="mini-label" x="545" y="82">깊은 표적</text>
    <text class="mini-label" x="545" y="152">중간 표적</text>
    <text class="mini-label" x="545" y="222">짧은 출구</text>
    <text class="mini-label" x="270" y="65">④ 깊이를 나눈다</text>
    <path class="line-scrimmage" d="M24 280H696"/>
    <text class="field-label" x="24" y="270">LINE OF SCRIMMAGE</text>
    <path data-action="free-rusher" class="pressure-path" d="M430 300 Q420 335 375 350" marker-end="url(#scramble-red)"/>
    <path data-action="qb-rollout" class="route-path" d="M315 355 Q420 405 575 350" marker-end="url(#scramble-yellow)"/>
    <path class="route-stem" d="M355 205 H245" stroke-dasharray="6 5"/>
    <path data-action="receiver-return" class="route-path" d="M245 205 Q200 160 270 140 H475" marker-end="url(#scramble-yellow)"/>
    ${player(290,355,'QB')}${player(430,280,'D','defense',18)}${player(375,205,'WR')}
    <text class="mini-label" x="24" y="325">① 자유 러셔</text>
    <text class="mini-label" x="505" y="315">② QB 이동 →</text>
    <text class="mini-label" x="24" y="115">③ Chism 경로 변경 →</text>
    <text class="mini-label" x="24" y="415">점선: 원래 크로싱 · 노랑: 새 이동 · 빨강: 압박</text>
  </svg>`;
}

function coordinatedPocketCompression(item) {
  return `<section class="pocket-compression" aria-label="${escapeXml(item.title)}" style="max-width:100%;min-width:0;overflow-wrap:anywhere">
    <svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-label="양쪽과 내부 압박의 관계 개념도" style="max-width:100%;height:auto">
      <rect class="field-bg" width="720" height="430" rx="12"/>
      <text class="field-label" x="24" y="35">공격 ↑ · 실제 배치 재현 아님</text>
      <path class="line-scrimmage" d="M24 175H696"/>
      <defs><marker id="pocket-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="#ff5b68" d="M0 0L10 5L0 10z"/></marker></defs>
      <path data-action="edge-compression" class="pressure-path" d="M160 130 Q140 300 295 340 M560 130 Q580 300 425 340" marker-end="url(#pocket-arrow)"/>
      <path data-action="interior-push" class="pressure-path" d="M330 130 L330 275" marker-end="url(#pocket-arrow)"/>
      <path data-action="finish" class="pressure-path" d="M420 145 Q465 245 380 320" marker-end="url(#pocket-arrow)"/>
      ${player(205,210,'OT')}${player(515,210,'OT')}${player(330,210,'G')}${player(360,345,'QB')}
      <text class="mini-label" x="35" y="105">Van Ness</text><text class="mini-label" x="555" y="105">Sorrell</text>
      <text class="mini-label" x="265" y="95">Brooks</text><text class="mini-label" x="400" y="95">Wyatt</text>
      <text class="mini-label" x="280" y="400">Young · 탈출 공간 축소</text>
    </svg>
    <details open><summary><strong>① 양쪽을 좁힌다</strong></summary><p>Van Ness와 Sorrell의 압박이 양옆 출구를 줄인다. 한쪽만 깊이 돌면 반대편 탈출구가 남을 수 있어 두 엣지의 깊이를 함께 본다.</p></details>
    <details open><summary><strong>② 앞쪽도 막는다</strong></summary><p>Brooks가 가드를 밀어 QB가 앞으로 올라올 공간도 줄인다. 포켓은 QB를 보호하는 공간이며, 옆문과 앞문을 함께 닫는 원리다.</p></details>
    <details open><summary><strong>③ Wyatt가 마무리한다</strong></summary><p>색 기록은 Wyatt의 것이지만 압박 과정은 공동 작업이다. 공격은 빠른 패스나 보호 보조로 대응할 수 있어, 수비는 서로의 깊이와 탈출 통로를 맞춰야 한다.</p></details>
  </section>`;
}

function goPostGoCover3(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="gpg-title gpg-desc" style="max-width:100%;height:auto">
    <title id="gpg-title">${escapeXml(item.title)}</title>
    <desc id="gpg-desc">일반 개념도 · 실제 배치 재현 아님. 1 짧은 모션으로 바깥 순서 변경. 2 양쪽 go와 안쪽 post가 깊은 세 구역을 시험. 3 QB가 포켓 안에서 전진. 수비는 중앙 포스트와 바깥 세로 경로를 함께 관리한다.</desc>
    <defs><marker id="gpg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="28">989 · GO–POST–GO · 공격 ↑</text>
    <g fill="#78c8ff" fill-opacity="0.12" stroke="#78c8ff" stroke-dasharray="6 5">
      <rect data-zone="deep-left" x="30" y="50" width="210" height="125" rx="12"/>
      <rect data-zone="deep-middle" x="255" y="50" width="210" height="125" rx="12"/>
      <rect data-zone="deep-right" x="480" y="50" width="210" height="125" rx="12"/>
    </g>
    <text class="mini-label" x="55" y="72">왼쪽 깊은 존</text><text class="mini-label" x="280" y="72">중앙 세이프티</text><text class="mini-label" x="500" y="72">오른쪽 깊은 존</text>
    <path class="line-scrimmage" d="M24 300H696"/>
    <path data-action="short-motion" d="M545 340H635" fill="none" stroke="#78c8ff" stroke-width="4" stroke-dasharray="6 5" marker-end="url(#gpg-arrow)"/>
    <path data-action="left-go" class="route-path" d="M100 300V100" marker-end="url(#gpg-arrow)"/>
    <path data-action="right-go" class="route-path" d="M635 300V100" marker-end="url(#gpg-arrow)"/>
    <path data-action="deep-post" d="M510 300V210L365 100" fill="none" stroke="#78c8ff" stroke-width="5" marker-end="url(#gpg-arrow)"/>
    <path data-action="qb-step-up" class="route-path" d="M350 365V315" marker-end="url(#gpg-arrow)"/>
    ${player(100,325,'WR')}${player(510,325,'WR')}${player(635,325,'WR')}${player(350,390,'QB')}
    <text class="mini-label" x="115" y="190">GO</text><text class="mini-label" x="515" y="190">POST ↖</text><text class="mini-label" x="640" y="190">GO</text>
    <text class="mini-label" x="420" y="378">① 짧은 모션 →</text><text class="mini-label" x="180" y="360">③ QB 전진 ↑</text>
    <text class="field-label" x="24" y="420">② 깊은 세 구역 읽기 · 일반 개념도</text>
  </svg>`;
}

function stuntProtectionExchange(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="exchange-title exchange-desc" style="max-width:100%;height:auto">
    <title id="exchange-title">${escapeXml(item.title)}</title>
    <desc id="exchange-desc">일반 개념도 · 실제 배치 재현 아님. 첫 러셔가 안으로 파고들고 두 번째 러셔가 뒤로 돌아 교차한다. 공격라인은 첫 상대를 동료에게 넘기고 돌아오는 러셔를 받아 QB를 보호한다.</desc>
    <defs><marker id="exchange-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="35">스턴트와 담당 교환 · 공격 ↑</text>
    <path class="line-scrimmage" d="M24 240H696"/>
    <path data-action="penetrator" class="pressure-path" d="M260 135L380 255" marker-end="url(#exchange-arrow)"/>
    <path data-action="looper" class="pressure-path" d="M430 135Q430 190 320 190Q230 190 260 270" marker-end="url(#exchange-arrow)"/>
    <path data-action="protection-exchange" d="M290 290H365" fill="none" stroke="#78c8ff" stroke-width="4" stroke-dasharray="6 5" marker-end="url(#exchange-arrow)"/>
    ${player(260,110,'D','defense')}${player(430,110,'D','defense')}${player(260,300,'OL')}${player(400,300,'OL')}${player(350,380,'QB')}
    <text class="mini-label" x="55" y="110">① 첫 진입</text><text class="mini-label" x="465" y="160">② 돌아오는 러셔</text>
    <text class="mini-label" x="450" y="300">③ 옆 동료와 교환</text>
    <text class="mini-label" x="24" y="420">빨강: 두 러셔의 교차 · 파랑 점선: 담당 인계</text>
  </svg>`;
}

function poachQuartersTrips(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 480" role="img" aria-labelledby="poach-title poach-desc" style="max-width:100%;height:auto">
    <title id="poach-title">${escapeXml(item.title)}</title>
    <desc id="poach-desc">일반 개념도 · 실제 정렬 재현 아님. 단독 WR는 CB가 맡고 약측 세이프티는 trips의 No.3를 돕는다. 강측 CB는 아웃을 제한한다. 파란 점선은 커버 도움, 빨간 곡선은 루프 러시다. 노란 corner-stop은 별도 플레이에서의 공격 대응이다.</desc>
    <defs><marker id="poach-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="480" rx="12"/>
    <text class="field-label" x="24" y="28">POACH QUARTERS · 공격 ↑</text>
    <text class="mini-label" x="24" y="58">약측: 단독 WR</text><text class="mini-label" x="450" y="58">강측: TRIPS (3명)</text>
    <path class="line-scrimmage" d="M24 300H696"/>
    <path data-action="solo-lock" d="M100 180V285" fill="none" stroke="#78c8ff" stroke-width="4" stroke-dasharray="7 5"/>
    <path data-action="weak-safety-help" d="M235 105Q320 80 430 180" fill="none" stroke="#78c8ff" stroke-width="5" stroke-dasharray="7 5" marker-end="url(#poach-arrow)"/>
    <path data-action="flat-out" d="M635 240H555" fill="none" stroke="#78c8ff" stroke-width="5" stroke-dasharray="7 5" marker-end="url(#poach-arrow)"/>
    <path data-action="loop-rush" class="pressure-path" d="M310 245Q235 245 260 305Q275 350 330 365" marker-end="url(#poach-arrow)"/>
    <path data-action="corner-stop" class="route-path" d="M450 290V195L530 150H550" marker-end="url(#poach-arrow)"/>
    ${player(100,320,'WR')}${player(100,155,'CB','defense')}${player(215,100,'S','defense')}${player(590,100,'S','defense')}${player(635,210,'CB','defense')}
    ${player(450,320,'No.3')}${player(545,320,'No.2')}${player(640,320,'No.1')}${player(310,220,'D','defense')}${player(350,380,'QB')}
    <text class="mini-label" x="34" y="115">단독 담당</text><text class="mini-label" x="270" y="115">약측 S → No.3</text>
    <text class="mini-label" x="470" y="85">강측 S</text><text class="mini-label" x="475" y="275">아웃 제한</text>
    <text class="mini-label" x="30" y="365">루프 러시 →</text><text class="mini-label" x="420" y="380">대응: CORNER-STOP</text>
    <text class="mini-label" x="24" y="430">파랑 점선: 커버 · 빨강: 러시</text>
    <text class="mini-label" x="24" y="462">노랑: 별도 장면의 대응 루트 · 실제 정렬 재현 아님</text>
  </svg>`;
}

function teammatePassTipInterception(item) {
  return `<svg class="play-diagram" viewBox="0 0 720 430" role="img" aria-labelledby="teamtip-title teamtip-desc" style="max-width:100%;height:auto">
    <title id="teamtip-title">${escapeXml(item.title)}</title>
    <desc id="teamtip-desc">일반 개념도 · 실제 정렬 재현 아님. Booker가 패스를 굴절시키고 다른 수비수 Lynch가 확보하는 두 역할을 구분한다.</desc>
    <defs><marker id="teamtip-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="#ffd54a" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="720" height="430" rx="12"/>
    <text class="field-label" x="24" y="32">Booker 굴절 → Lynch 확보</text>
    <path class="line-scrimmage" d="M24 270H696"/>
    <path data-action="intended-pass" class="pass-path" d="M160 335L330 245L580 125" stroke-dasharray="8 7"/>
    <path data-action="deflection" class="route-path" d="M330 245Q345 90 480 185" marker-end="url(#teamtip-arrow)"/>
    ${player(145,350,'QB')}${player(330,270,'D','defense')}${player(500,205,'D','defense')}${player(600,110,'TE')}
    <text class="mini-label" x="40" y="310">① Darnold 패스</text>
    <text class="mini-label" x="235" y="320">② Booker 접촉</text>
    <text data-action="possession" class="mini-label" x="475" y="260">③ Lynch 포구</text>
    <text class="mini-label" x="470" y="75">원래 표적: Barner</text>
    <text class="mini-label" x="24" y="395">서로 다른 수비수의 연결 · 실제 정렬 재현 아님</text>
  </svg>`;
}

function splitZoneCutback(item) {
  return `<svg class="play-diagram" viewBox="0 0 560 450" role="img" aria-labelledby="split-title split-desc" style="max-width:100%;height:auto">
    <title id="split-title">${escapeXml(item.title)}</title>
    <desc id="split-desc">일반 개념도 · 실제 정렬 재현 아님. 공격 방향은 위쪽. 다섯 OL은 오른쪽 존 블로킹, TE는 왼쪽으로 가로질러 뒤쪽 DE와 접촉한다. RB는 오른쪽 흐름을 읽고 안쪽으로 컷백한다. LB는 컷백 통로를 지킨다.</desc>
    <defs><marker id="split-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="560" height="450" rx="12"/>
    <text class="mini-label" x="20" y="32">SPLIT-ZONE · 공격 ↑</text>
    <text class="mini-label" x="20" y="66">① OL 오른쪽 →</text>
    <path class="line-scrimmage" d="M20 205H540"/>
    <path data-action="zone-right" d="M270 220H450" fill="none" stroke="#78c8ff" stroke-width="5" marker-end="url(#split-arrow)"/>
    <path data-action="sift-left" d="M455 280Q340 310 175 245" fill="none" stroke="#78c8ff" stroke-width="5" stroke-dasharray="7 5" marker-end="url(#split-arrow)"/>
    <circle data-action="edge-contact" cx="160" cy="230" r="27" fill="none" stroke="#ff5b68" stroke-width="4"/>
    <path data-action="rb-cutback" class="route-path" d="M330 375Q420 335 370 310Q300 300 245 270L245 170" marker-end="url(#split-arrow)"/>
    ${player(210,245,'OL','offense',18)}${player(265,245,'OL','offense',18)}${player(320,245,'OL','offense',18)}${player(375,245,'OL','offense',18)}${player(430,245,'OL','offense',18)}
    ${player(475,280,'TE')}${player(320,320,'QB')}${player(330,395,'RB')}${player(155,185,'DE','defense')}${player(245,120,'LB','defense')}
    <text class="mini-label" x="20" y="300">② TE 뒤쪽 차단</text>
    <text class="mini-label" x="20" y="345">③ RB 컷백 ↖</text>
    <text class="mini-label" x="290" y="125">LB: 컷백 통로</text>
    <text class="mini-label" x="20" y="435">파랑: 블록 · 노랑: 러닝</text>
  </svg>`;
}

function passProtectionResponsibility(item) {
  const panels = [
    {title:'① OL 일대일', action:'interior-pressure', path:'M280 85V142', actors:player(280,65,'DL','defense',18), note:'안쪽 블록의 승패'},
    {title:'② RB 추가 러셔', action:'rb-pressure', path:'M420 85Q425 145 385 205', actors:player(420,65,'LB','defense',18), note:'추가 압박 담당 확인'},
    {title:'③ QB 공 처리', action:'qb-decision', path:'M270 242Q160 220 105 85', actors:player(95,65,'WR','offense',18), note:'표적과 던질 시간'}
  ];
  return `<section class="protection-responsibility" aria-label="${escapeXml(item.title)}" style="max-width:100%;min-width:0;overflow-wrap:anywhere">
    <p>일반 개념도 · 실제 정렬 재현 아님 · 공격 ↑</p>
    ${panels.map((p,i) => `<div data-panel="${i+1}"><p><strong>${p.title}</strong> · ${p.note}</p>
      <svg class="play-diagram" viewBox="0 0 560 300" role="img" aria-label="${p.title}" style="display:block;width:100%;max-width:100%;height:auto">
        <defs><marker id="responsibility-${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="${i===2?'#ffd54a':'#ff5b68'}" d="M0 0L10 5L0 10z"/></marker></defs>
        <rect class="field-bg" width="560" height="300" rx="12"/>
        <path class="line-scrimmage" d="M20 145H540"/>
        <path data-action="${p.action}" class="${i===2?'pass-path':'pressure-path'}" d="${p.path}" marker-end="url(#responsibility-${i})"/>
        ${i===1?'<path data-action="rb-block" d="M365 235L390 205M380 195L400 215" fill="none" stroke="#78c8ff" stroke-width="5"/>':''}
        ${[170,225,280,335,390].map(x=>player(x,175,'OL','offense',18)).join('')}
        ${player(280,260,'QB','offense',20)}${player(365,250,'RB','offense',18)}${p.actors}
      </svg></div>`).join('')}
    <p>빨강: 압박 · 파랑: 블록 · 노랑 점선: QB의 패스 선택</p>
  </section>`;
}

function blitzProtectionMiddleCatchRun(item) {
  return `<svg class="play-diagram" viewBox="0 0 560 480" role="img" aria-labelledby="middle-title middle-desc" style="display:block;width:100%;max-width:100%;height:auto">
    <title id="middle-title">${escapeXml(item.title)}</title>
    <desc id="middle-desc">OL이 압박을 막아 QB의 시간을 확보하고 가운데 WR로 패스한다. 포구 뒤 전진과 후방 수비의 추격을 구분한 개념도. 실제 정렬 재현 아님.</desc>
    <defs><marker id="middle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
    <rect class="field-bg" width="560" height="480" rx="12"/>
    <text class="mini-label" x="20" y="30">보호 → 가운데 패스 → 전진 · 공격 ↑</text>
    <path d="M20 70H540" stroke="#78c8ff" stroke-width="3"/>
    <text class="mini-label" x="20" y="62">엔드존</text>
    <path data-action="pressure" class="pressure-path" d="M140 230L215 295" marker-end="url(#middle-arrow)"/>
    <path data-action="protection" d="M175 315H350" fill="none" stroke="#78c8ff" stroke-width="7"/>
    <path data-action="middle-pass" class="pass-path" d="M280 385Q390 310 280 225" marker-end="url(#middle-arrow)"/>
    <path data-action="run-after-catch" class="route-path" d="M280 200Q335 140 300 85" marker-end="url(#middle-arrow)"/>
    <path data-action="pursuit" class="pressure-path" d="M420 125Q395 105 335 95" marker-end="url(#middle-arrow)"/>
    ${player(280,400,'QB')}${player(280,315,'OL')}${player(280,210,'WR')}${player(435,145,'S','defense')}
    <text class="mini-label" x="20" y="270">① 압박 차단</text>
    <text class="mini-label" x="355" y="275">② 가운데 패스</text>
    <text class="mini-label" x="20" y="155">③ 포구 뒤 전진</text>
    <text class="mini-label" x="400" y="200">추격·태클</text>
    <text class="mini-label" x="20" y="445">50야드: 전체 이득 · 공중/YAC 분할 없음</text>
    <text class="mini-label" x="20" y="472">실제 정렬 재현 아님 · 거리 비례 아님</text>
  </svg>`;
}

function counterHotPlayAction(item) {
  return `<section class="counter-hot" aria-label="${escapeXml(item.title)}" style="max-width:100%;min-width:0;overflow-wrap:anywhere">
    <svg class="play-diagram" viewBox="0 0 560 480" role="img" aria-labelledby="counter-title counter-desc" style="display:block;width:100%;max-width:100%;height:auto">
      <title id="counter-title">${escapeXml(item.title)}</title>
      <desc id="counter-desc">일반 개념도 · 실제 정렬 재현 아님. 공격은 위쪽. 가드가 풀한 뒤 보호하고 QB는 러닝 페이크, TE는 라인배커 뒤와 세이프티 앞을 가로지른다. 실선은 이동, 짧은 점선은 수비 반응, 긴 점선은 패스.</desc>
      <defs><marker id="counter-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path fill="context-stroke" d="M0 0L10 5L0 10z"/></marker></defs>
      <rect class="field-bg" width="560" height="480" rx="12"/>
      <text class="mini-label" x="20" y="30">COUNTER-HOT · 공격 ↑</text>
      <path class="line-scrimmage" d="M20 275H540"/>
      <path data-action="guard-pull" d="M220 305Q270 350 370 310" fill="none" stroke="#78c8ff" stroke-width="4" marker-end="url(#counter-arrow)"/>
      <path data-action="pass-protection" d="M360 285H400M380 285V310" fill="none" stroke="#78c8ff" stroke-width="6"/>
      <path data-action="run-fake" d="M280 355Q330 380 350 410" fill="none" stroke="#ffd54a" stroke-width="4" marker-end="url(#counter-arrow)"/>
      <path data-action="lb-reaction" d="M195 220V250M355 220V250" fill="none" stroke="#ff5b68" stroke-width="4" stroke-dasharray="3 5" marker-end="url(#counter-arrow)"/>
      <path data-action="te-cross" d="M465 295V185Q465 150 410 150H180" fill="none" stroke="#ffd54a" stroke-width="5" marker-end="url(#counter-arrow)"/>
      <path data-action="qb-pass" d="M280 355Q300 250 200 150" fill="none" stroke="#ffd54a" stroke-width="4" stroke-dasharray="10 7" marker-end="url(#counter-arrow)"/>
      ${player(280,300,'C','offense',18)}${player(220,300,'LG','offense',18)}${player(280,350,'QB')}${player(280,425,'RB')}${player(465,315,'TE')}${player(195,200,'LB','defense')}${player(355,200,'LB','defense')}${player(280,85,'S','defense')}
      <text class="mini-label" x="325" y="90">깊은 세이프티</text>
      <text class="mini-label" x="20" y="135">③ TE 크로싱 ←</text>
      <text class="mini-label" x="20" y="335">① 가드 풀 →</text>
      <text class="mini-label" x="365" y="365">② 보호 유지</text>
      <text class="mini-label" x="20" y="405">러닝 페이크 ↘</text>
      <text class="mini-label" x="20" y="465">실선: 이동 · 점선: 반응/패스</text>
    </svg>
    <details open><summary>① 러닝을 닮은 출발</summary><p>가드의 풀과 QB의 핸드오프 페이크가 러닝처럼 보인다. 수비는 첫 동작만이 아니라 TE의 릴리스도 읽는다.</p></details>
    <details open><summary>② 가드는 보호를 유지</summary><p>풀한 가드는 패스 러셔를 막을 균형을 지킨다. 러닝처럼 보이는 출발이 무리한 돌진을 뜻하지는 않는다.</p></details>
    <details open><summary>③ 두 수비 층 사이로</summary><p>TE가 라인배커 뒤·중앙 세이프티 앞을 가로지른다. 수비는 페이크에 반응한 뒤 뒤 공간을 회복해야 한다.</p></details>
    <p>일반 개념도 · 실제 정렬 재현 아님. 투하이 때의 시임 선택은 별도 변형이며 이 그림의 동시 루트가 아니다.</p>
  </section>`;
}

export function renderTacticDiagram(item) {
  if (item?.diagram?.kind === 'counter-hot-play-action') return counterHotPlayAction(item);
  if (item?.diagram?.kind === 'blitz-protection-middle-catch-run') return blitzProtectionMiddleCatchRun(item);
  if (item?.diagram?.kind === 'pass-protection-responsibility') return passProtectionResponsibility(item);
  if (item?.diagram?.kind === 'split-zone-cutback') return splitZoneCutback(item);
  if (item?.diagram?.kind === 'poach-quarters-trips') return poachQuartersTrips(item);
  if (item?.diagram?.kind === 'teammate-pass-tip-interception') return teammatePassTipInterception(item);
  if (item?.diagram?.kind === 'go-post-go-vs-cover3') return goPostGoCover3(item);
  if (item?.diagram?.kind === 'stunt-protection-exchange') return stuntProtectionExchange(item);
  if (item?.diagram?.kind === 'coordinated-pocket-compression') return coordinatedPocketCompression(item);
  if (item?.diagram?.kind === 'scramble-drill-levels') return scrambleDrillLevels(item);
  if (item?.diagram?.kind === 'pass-tip-interception') return passTipInterception(item);
  if (item?.diagram?.kind === 'rb-rotation-options') return rbRotationOptions(item);
  if (item?.diagram?.kind === 'fourth-down-clock-decision') return fourthDownClockDecision(item);
  if (item?.diagram?.kind === 'loop-stunt') return loopStunt(item);
  if (item?.diagram?.kind === 'double-dig-vs-tampa2') return doubleDig(item);
  if (item?.diagram?.kind === 'catch-and-run') return catchAndRun(item);
  if (item?.diagram?.kind === 'fourth-down-db-blitz') return fourthDownDbBlitz(item);
  if (item?.diagram?.kind === 'hook-and-ladder') return hookAndLadder(item);
  if (item?.diagram?.kind === 'blitz-hot-read') return blitzHotRead(item);
  if (item?.diagram?.kind === 'back-shoulder') return backShoulder(item);
  return `<div class="diagram-fallback">이 전술의 전용 다이어그램을 준비 중입니다.</div>`;
}
