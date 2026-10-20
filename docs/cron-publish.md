# 20:00 KST 발행 작업 — 단일 실행 계약

독자용 편집 점검: 조사 로그·파일명·수집 절차를 lead/dek의 소재로 쓰지 않는다. 리그 전체에서 중요한 소식이 대표 제목에 남아야 하며 작은 후속 소식 하나 때문에 더 중요한 기사를 대표에서 밀어내지 않는다. `[12]` 같은 내부 출처 번호는 공개 본문에 남기지 않고 실제 sources 링크로 제공한다. 전술은 이미 검증된 유효한 0~2개를 유지하며 개별 장면을 확보하지 못한 설명을 억지로 추가하지 않는다. 의미 없는 ‘해설:’ 접두어나 도식 불확실성의 반복을 줄이고 중요한 불확실성만 한 번 명시한다.

/Users/user/projects/nfl-briefing에서 실행한다. docs/cron-research.md의 편집 목적과 검증 기준을 따른다. 리그 전체 폭넓은 이해→관심팀 심화→전술·검증된 영상·미래 관전 연결이 목적이다. 기사 수나 기술 테스트는 완성의 대체가 아니다.

1. terminal로 오늘 KST 날짜를 구하고 `python3 scripts/research-artifact.py check <date>`를 실행한다. .incoming/<date>.ready.json의 runId, startedAt, completedAt 및 JSON/audit의 SHA256을 검증한다. 아침 파일, 다른 run의 audit, 누락·날짜 불일치·18시 이전 조사 시작·6시간 초과 자료를 발행하지 않는다. 채팅 출력이나 오래된 성공 상태를 입력으로 사용하지 않는다.
2. 실패하면 docs/cron-research.md 수행 절차로 실제 웹 재조사하여 새로운 run 디렉터리에 복구 입력과 진짜 감사 기록을 작성·검증·seal한다. 이전 원본은 보존한다. 기존 audit를 시각만 바꾸거나 검사를 통과하도록 꾸미지 않는다. 같은 실행에서 복구를 시도하되 전체 자료 신뢰성 또는 필수 작업이 막히면 정확한 실패 단계를 보고한다.
3. `node scripts/check-handoff.mjs .incoming/<date>.json .incoming/<date>.audit.json --date <date> --not-before <date>T18:00:00+09:00`와 source coverage checker를 실행하고 gameCoverage, editorialCoverage, retention을 읽는다. 오늘 기존 유효 뉴스·전술·영상·미래 일정을 보존한 완전판인지 확인한다. 설명은 도식 먼저, 이어 실제 단계 흐름에 개념·쉬운 풀이·작동 원리·수비 대응을 통합한다. 유튜브 실제 장면·정확한 시점만 연결한다. 미검증 개별 기사/영상은 해당 항목만 제외한다. 중요한 내용을 임의로 줄이거나 빈 배열로 기존판을 덮어쓰지 않는다.
4. src/publish.js의 preparePublication을 읽기 전용 실행해 제외 결과와 lead/dek 일치를 확인한다. 잔여 오류는 별도 복구 입력에서 해결한 후 새 감사 쌍으로 seal한다. eventKey 변경/검증 비활성화로 우회하지 않는다. 새 소식 없음은 공개 성공과 다르며 기존판을 그대로 유지한다.
5. 변경 전 git status를 확인한다. src/data.js 또는 editions/에 다른 사람의 미커밋 변경이 있으면 덮어쓰지 않는다. 관련 없는 파일은 수정·stage하지 않는다. `npm run publish -- .incoming/<date>.json` → `npm test` → `git diff --check` → `git diff -- src/data.js editions/`를 확인한다. 예상 날짜 외 내용 소실이 없어야 한다.
6. `git add -- src/data.js editions/` 후 `content: publish NFL briefing <date>`로 커밋한다. 변경 없으면 빈 커밋을 만들지 않는다. `git push origin main`; 로컬 HEAD와 `git ls-remote origin refs/heads/main` SHA를 비교한다. 코드·UI·설정·.incoming은 stage하지 않는다.
7. `gh api repos/kihong9336/nfl-briefing/pages/builds/latest`의 commit이 위 SHA이고 status=built인지 확인한다. 진행 중이면 최대90초 제한 안에서 재확인한다. 공개 /editions/<date>/ HTTP200, 실제 제목·og:title·canonical·원문링크 및 공개 src/data.js의 날짜·내용을 readback한다. 다른 SHA의 built를 이번 성공으로 부르지 않는다. 입력·audit·ready·증거는 삭제하지 않고 내부 보존한다.

최종 출력은 존댓말로 핵심3줄 이내와 실제 공개 URL, 검증된 SHA 앞7자리·실제 테스트 개수. 공개 확인 완료시에만 '웹 업데이트 완료'. push만 됐으면 '저장소 반영 완료 · 공개 페이지 빌드 대기 중'. 실패는 첫 줄 [CRON_FAILURE], 다음에 실제 단계/시도한 복구/남은 장애를 구체적으로 알린다. 별도 메시지 발송 없이 최종 응답을 자동 Telegram 전달에 맡긴다.
