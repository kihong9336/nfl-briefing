# 18:00 KST 연구 작업 — 단일 실행 계약

작업 디렉터리 /Users/user/projects/nfl-briefing. 실제 현재 KST 날짜와 시각을 terminal로 확인한다. 이 작업은 조사·파일 전달만 한다. src/data.js, 공개 HTML, git commit/push는 수정/실행하지 않는다.

## 편집 목적
NFL 리그 전체를 폭넓게 이해하고 매일 더 즐겁고 수준 높게 관전하도록 돕는다. 49ers/Chiefs/Patriots는 추가 심화이지 리그 전체의 대체가 아니다. 사건→중요성→팀/리그 맥락→다음 관찰점을 자체 설명한다. 숫자 할당이나 테스트 통과로 편집 완성을 대신하지 않는다.

## 수행
1. README의 데이터 스키마, docs/news-sourcing.md, src/publish.js, src/publication-guard.js를 읽고 src/data.js의 오늘 판 및 최근 7일 실제 발행본을 확인한다. 과거 오전 입력이 아니라 현재 공개된 오늘 판을 보존 기준으로 삼는다. terminal로 시작시각 startedAt와 고유 runId를 생성하여 .incoming/<date>.<runId>/에 즉시 기록한다.
2. 실제 웹 검색과 본문 열기로 최근 24~36시간 리그 경기/부상·로스터/계약·트레이드·징계/순위·전술을 조사한다. NFL, ESPN, AP, CBS, NBC/PFT, Yahoo 중 최소 4조직 접근 시도와 최소 2조직 본문 확인. 실패도 URL·실제 조회시각·사유를 남긴다. 스니펫/기억/이전 발행본은 새로운 사실 검증이 아니다. 공식 경기 기록에서 점수·선수·수치·소속·상태를 재검증하고 내부 원문 증거를 저장한다. 독립 두 번째 출처를 가능하면 대조한다.
3. 공식 해당 주차 스코어보드의 완료 경기 전부를 gameCoverage에 대조한다: matchup, source, checkedAt, disposition(기존발행/신규/후속/제외), reason. 조사범위의 기준 URL과 주차를 기록하며 미대조 경기는 재조사한다. 완료경기가 없다는 판단도 실제 조회 근거를 남긴다. NFL 주차를 확인 못하면 WEEK 표기를 생략한다.
4. 안정적인 eventKey로 최근 발행과 비교하고 의미 있는 takeaway를 쓴다. 새 사실 없는 반복만 기사별 제외한다. 갱신형 동일 URL은 사건 동일성의 증거가 아니다. 후속은 최상위 changeSummary, changeEvidence={url,before,after,quote}를 실제 근거로 채우고 번역 인용이면 originalQuote와 번역임을 기록한다. 문자열을 맞추려고 사실/인용을 만들지 않는다.
5. 오늘 판이 이미 있으면 그 유효 뉴스·전술·영상·미래일정을 명시적으로 병합하여 완전한 대체판을 만든다. 변경 없는 기존 항목을 새 소식으로 부르지 않는다. 제거/교체는 audit.retention에 대상과 실제 사유를 기록한다. 새 소식이 없으면 기존 오늘 판을 유지하며 조사 결과만 기록한다. 미래 일정은 누락을 취소로 취급하지 않는다.
6. 전술과 개별 YouTube 영상을 실제 조사한다. audit.editorialCoverage.tactics/highlights 각각 {status:selected|unavailable,sources:[실제 조회URL],candidates:[검토내용],reason} 기록. 코너가 비어도 조사 생략 금지. 전술은 도식 먼저, 이어 스냅 전→움직임→판단→결과 흐름 안에서 개념·쉬운 설명·작동 원리·수비 대응을 통합한다. 코드가 지원하는 정확한 도식만 쓰며 일반 도식을 실제 배치 재현처럼 주장하지 않는다. 영상은 공식 개별 YouTube 우선, 실제 장면과 정확한 타임스탬프를 확인한 경우만 붙인다. 전체 경기 영상의 미확인 시점을 추측하거나 공식 웹 영상으로 대체하지 않는다. 영상 부재는 검증된 뉴스 발행을 막지 않는다.
7. run 디렉터리에 edition.json과 audit.json을 작성한다. audit에는 date, runId, startedAt, completedAt, checkedAt(실제 조사 종료 ISO시각), coverage, candidates, gameCoverage, editorialCoverage, retention을 포함한다. 모든 기록은 실제 수행 근거여야 한다. 기존 audit를 이름/시각만 바꿔 재사용하지 않는다.
8. `node scripts/check-handoff.mjs <edition경로> <audit경로> --date <date> --not-before <date>T18:00:00+09:00` 및 node scripts/check-source-coverage.mjs <audit경로> --date <date> 실행. src/publish.js의 preparePublication(briefings,input) 및 validateEdition을 import하여 읽기 전용 검증한다. 제외 기사를 lead/dek에 남기지 않는다. 문제 기사는 개별 수정/제외하고 재검증한다. partial이면 접근 제한을 dek에 명시한다. 테스트를 우회하지 않는다.
9. 성공한 쌍만 `python3 scripts/research-artifact.py seal <edition경로> <audit경로>`로 전달한다. 이 도구는 날짜·시각·쌍의 해시 및 편집 감사 존재를 검사하고 .incoming/<date>.json, .incoming/<date>.audit.json, 마지막으로 .incoming/<date>.ready.json을 원자적으로 교체한다. 원본 run 디렉터리를 보존한다. 완료 후 `python3 scripts/research-artifact.py check <date>`로 재검증한다.

## 유일한 최종 출력
성공: `ARTIFACT_READY: /Users/user/projects/nfl-briefing/.incoming/<date>.ready.json runId=<실제ID>`
실패: 첫 줄 `[CRON_FAILURE]`, 다음 줄 `PUBLISH_BLOCKED: <실제 실패 단계·도구 오류·보존한 증거 경로>`.
채팅 JSON 출력, 거짓 성공, 일반적인 파일 오류로 원인 숨기기 금지. 실패해도 이전 유효 파일을 삭제하지 않는다.
