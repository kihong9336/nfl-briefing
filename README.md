# NFL 브리핑 — 스포츠 뉴스룸 MVP

49ers, Chiefs, Patriots 팬을 우선하는 한국어 NFL 해설 아카이브입니다. 매일 오전 8시(KST)에 새 브리핑을 발행합니다.

## 현재 구현

- 상단 날짜 레일과 달력 입력
- 인터랙티브 앱 날짜 선택: `?date=YYYY-MM-DD` (필터·다이얼로그 사용)
- 공유용 정적 원문: `./editions/YYYY-MM-DD/` (JavaScript 없이 본문·날짜별 OG 메타데이터 제공)
- 전체 정적 아카이브: `./editions/` — 앱 상단에서 원문·공유 링크 접근
- 전체 / 49ers / Chiefs / Patriots 필터
- 리그 핵심 뉴스, 팀 포커스, 해설, 관전 포인트
- 공식 하이라이트 영역
- 다가오는 경기 보드
- 모바일 390px 대응
- 실제 검증 발행본에는 공식 출처 링크 표시
- 과거 디자인 샘플에는 안전 배너 유지

## 실행

```bash
npm test
npm run serve
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 데이터 구조

날짜별 브리핑은 `src/data.js`에 누적됩니다. 새 발행본은 같은 구조의 JSON으로 만든 뒤 검증·업서트 스크립트로 추가합니다.

```bash
npm run publish -- /absolute/path/to/edition.json
npm test
```

발행 JSON은 `sample: false`여야 하며 모든 뉴스 항목에 하나 이상의 HTTPS 출처가 있어야 합니다. 같은 날짜를 다시 발행하면 기존 날짜 항목을 교체하고 최신 날짜순으로 정렬합니다.

권장 운영 흐름:

1. 매일 웹 검색 및 공식 출처 교차 검증
2. 구조화된 브리핑 JSON 생성
3. `publish-edition.mjs`로 데이터 검증·저장
4. `npm test && npm run build`로 검증·정적 HTML 재생성 후 `src/data.js`와 `editions/`를 함께 staging (`git add src/data.js editions/`); 코드 변경은 해당 파일도 명시하여 staging하고 검토 후 GitHub `main`에 push
5. GitHub Pages 배포 확인
6. Telegram에는 제목·핵심 3줄·정적 공유 URL (`https://kihong9336.github.io/nfl-briefing/editions/YYYY-MM-DD/`)만 전송. `?date=`는 앱 탐색용이며 날짜별 소셜 미리보기 주소가 아닙니다.

## 영상 링크 발행 원칙

- `highlights[].url`과 `tactics[].video.url`은 해당 경기·장면의 **NFL 또는 구단 공식 유튜브 영상 직접 링크**를 우선한다.
- 채널 진위, 영상 제목·시즌·상대 팀 일치를 확인한다. 검색결과 페이지나 채널 홈을 개별 영상 링크로 대신하지 않는다.
- 적합한 공식 유튜브 영상이 없거나 확인할 수 없을 때만 NFL·구단 공식 사이트 영상으로 대체하고 플랫폼을 명시한다. 추측한 영상 ID·재생 시점은 넣지 않는다.
- 기존 발행본의 영상도 교체할 때에는 동일 경기·내용임을 확인한 뒤 변경한다.

## 공개 배포

- 저장소: `kihong9336/nfl-briefing`
- 호스팅: GitHub Pages (`main` 브랜치 루트)
- 실제 발행 시작: 2026-10-16
- 2026-10-15 이전 항목은 UI 검증용 샘플로 보존

## 모바일 읽기 구조 (2026-10-17 개편)

짧은 제목 목차 → 선택 경기 보드 → 리그 → 관심 팀 → 접이식 전술 → 영상.
기사 본문은 공통 상세 다이얼로그 한 곳에만 표시하며 Escape/닫기/브라우저 뒤로가기로 닫습니다.
팀 필터는 관심 팀 기사에만 적용됩니다. 경기 상태는 입력된 구조화 필드만 사용하고 서술에서 점수를 추론하지 않습니다.

### 선택적 발행 필드 (기존 발행 JSON 호환)
- `sections[].update`: `{ "kind": "new" | "status-change" | "followup", "evidence": "https://..." }`. 실제 근거가 있을 때만 공급합니다. 누락 시 배지를 붙이지 않습니다.
- `sections[].sources[].publishedAt`: 시간대 포함 ISO 시각. 원문 게시 시각을 확인한 경우만 공급합니다. 발행본 날짜에서 생성하지 않습니다.
- 기존 schedule의 `status`는 예정/진행 중/종료/연기/취소를 그대로 표시합니다. 현재 데이터에 없는 결과·점수는 추가하지 않습니다.
- 전술은 독립 영상 검증으로 주장하지 않고 관전 제안으로 안내합니다.

자동 발행 작업 권고: 위 선택 필드의 근거를 확인할 때만 추가하고 미확인 필드는 생략합니다. 외부 프로필의 cron 설정은 수정하지 않았습니다.

### 브라우저 회귀 검증
```bash
npm install --no-save --package-lock=false playwright
python3 -m http.server 4175
# 별도 터미널
BASE_URL=http://localhost:4175 node scripts/check-mobile-ux.mjs
npm test
```
Chrome 채널로 390/375/320/1280px, 상세 닫기·뒤로가기·포커스 복귀·팀 필터·구판·날짜 변경·오버플로를 검사합니다.
스크린샷은 `docs/screenshots/redesign-review/`에 저장합니다.
