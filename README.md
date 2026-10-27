# NFL 브리핑 — 스포츠 뉴스룸 MVP

49ers, Chiefs, Patriots 팬을 우선하는 한국어 NFL 해설 아카이브입니다. 매일 오후 8시(KST)에 새 브리핑을 발행합니다.

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

## 읽기 전용 NFL 채팅 백엔드

`server/nfl_chat.py`는 선택 브리핑 문맥과 **Gemini 3.8 Flash** (`google/gemini-3.8-flash`)를 사용합니다. OpenRouter `web` 플러그인의 `engine: native`로 Google 네이티브 검색을 사용하며, **Google AI Mode 제품을 임베드하는 것이 아닙니다**. 기존 서버 전용 `OPENROUTER_API_KEY`만 사용하고 별도 Google 키나 프런트엔드 키는 필요하지 않습니다. 기존 환경변수/개인 프로필 dotenv 키 로딩 경로를 유지합니다.

- 고정 요청: `max_tokens: 3000`, `reasoning: {effort: low, exclude: true}`, `temperature: 0.3`. 클라이언트가 모델·검색 엔진·서버 날짜를 바꿀 수 없습니다.
- 일반 규칙/용어는 지식으로, 선택 판 질문은 해당 판 문맥으로 답변합니다. 최신/속보 질문은 Google 검색 확인과 실제 사건·보도 날짜를 요구합니다. 시스템 프롬프트에 서버 현재 KST 날짜와 선택 판 날짜를 별도로 주입합니다.
- 응답: `answer`, `sources` (최대 8개), `date`, `model`, `modelLabel`, `searched`. 검색 여부는 유효한 제공자 `url_citation` 또는 실제 `usage.server_tool_use_details.web_search_requests > 0`에서만 계산합니다. 플러그인 설정/모델의 주장/클라이언트 값만으로 검색했다고 표시하지 않습니다.
- HTTPS 검색 인용(공급자가 반환한 Google grounding redirect 포함)과 선택 판 출처만 허용하며 답변의 임의 URL은 제외합니다. 인용 URL을 서버가 직접 방문하거나 리디렉션을 해석하지 않습니다. 인용은 출처이지 사실 정확성의 보증은 아닙니다.
- 브리핑·대화·검색 자료는 비신뢰 데이터입니다. Hermes 도구/파일/계정/실행 접근은 없고 제공자 검색만 읽기 전용으로 사용합니다.
- 기존 CORS 허용 목록, 20 KB 요청 제한, 60초 upstream timeout, 클라이언트당 분당 6회·전체 시간당 10회/일 50회·동시 2회 제한을 유지합니다. 실패 요청도 과금 시도로 집계하며 장애로 남은 동시성 lease는 120초 후 해제하되 사용량은 유지합니다. 검색은 추가 비용이 들고 한 답변에서 여러 검색이 발생할 수 있으므로 요청 수 제한은 달러 단위 지출 상한이 아닙니다.
- 이 변경은 백엔드 코드만 제공하며 호스트 마운트/활성화·배포는 별도 작업입니다.

네트워크/유료 제공자 호출 없는 회귀 테스트:
```bash
uv run --with flask --with requests python -m unittest discover -s server -p test_nfl_chat.py
```

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

## 중복 발행 방지 계약

`npm run publish`는 저장하기 전에 직전 **7일**의 비샘플 발행본과 비교합니다. 같은 날짜의 교체본, 미래 발행본, 디자인 샘플은 비교 대상에서 제외합니다. `sections`와 `leagueWide`는 빈 배열도 허용합니다. 새 소식이 없으면 그 사실을 lead/dek에 적고, 기사 수를 맞추려고 예전 기사를 채우지 않습니다.

두 배열의 항목에 다음 선택 필드를 공급할 수 있습니다:

- `eventKey`: 시즌·대상·구체적 사건을 담은 소문자 kebab-case. 같은 사건은 제목·매체·팀 표기가 달라도 동일 키를 유지합니다. 이전 판에도 해당 키를 정확히 연결하세요. 키를 임의 변경해 검사를 우회하지 않습니다.
- `takeaway`: 원문과 본문에서 확인된 짧고 완결된 결론(10–180자 권장). 제목 재작성이나 첫 문장 자동 발췌가 아닙니다. 홈 상단에서 한 번만 표시하며 본문 카드에서 반복하지 않습니다. 없는 구판은 요약이라고 주장하지 않는 분류별 기사 읽기 링크를 표시합니다.
- 같은 사건의 후속은 `changeSummary`(새로 확인된 변화 설명)와 `changeEvidence: {url, before, after, quote}`를 함께 공급합니다. `before`는 직전 보도 요약/why의 실제 구절, `after`는 새 요약/why의 실제 달라진 구절, `quote`는 변경 사실을 확인한 원문의 구절(정확한 한국어 번역 가능)입니다. `after`가 quote에도 포함되어야 합니다. `url`은 해당 항목의 `sources[].url` 또는 `url`에 포함된 실제 확인 출처입니다. 이전과 같은 URL이어도 실제 갱신 내용이면 허용합니다.
- 기존 `update: {kind, evidence}`는 표시용 호환 필드이며 **중복 예외 증명이 아닙니다**. 배지나 새 URL만으로는 후속 발행할 수 없습니다.

검사기는 동일 eventKey, 또는 구판의 동일 구체적 출처+팀, 또는 동일 보도 요약을 비교합니다. 제목만으로 동일 사건이라 단정하지 않습니다. 같은 판 안의 같은 사건은 합쳐야 합니다. 서로 다른 키는 편집자의 구체적 사건 구분을 존중합니다. **의미 중복의 완전 탐지나 원문 진위 검증기는 아닙니다.** 키 없는 구판, 바뀐 출처·팀 표기·문장에는 탐지 한계가 있습니다. 조사 단계에서 이전 판을 읽고 원문을 직접 확인하는 절차는 여전히 필수입니다. 검증된 사실 변화를 제시할 수 없으면 해당 기사를 제외하세요.

선택 주차 메타데이터: `season: 2026`, `seasonType: "regular"`, `week: 1..18`; 포스트시즌은 `seasonType: "postseason"`과 `week: "wild-card" | "divisional" | "conference" | "super-bowl"`. 달력 주차로 NFL 주차를 계산하지 않습니다. 미확인 값은 생략합니다. 기존 edition 문자열은 역사 기록으로 보존하며 별도로 확인 후 수정합니다.

추가 브라우저 회귀: `node scripts/check-duplicate-content.mjs` — 최신·구판·샘플을 320/390/1280px에서 검사하며 제목 중복, 본문/출처 접근, 팀 필터의 리그 유지, 가로 넘침을 확인합니다. `BASE_URL`로 서버 주소를 지정할 수 있습니다.
