import test from 'node:test';
import assert from 'node:assert/strict';

import { preparePublication, upsertEdition, validateEdition } from '../src/publish.js';

for (const kind of ['hook-and-ladder', 'fourth-down-db-blitz']) {
  test(`validator accepts ${kind} without changing article or source fields`, () => {
    const edition = structuredClone(validEdition);
    edition.tactics[0].diagram.kind = kind;
    const before = structuredClone(edition);
    assert.equal(validateEdition(edition), edition);
    assert.deepEqual(edition, before);
    edition.tactics[0].diagram.kind = 'unknown-diagram';
    assert.throws(() => validateEdition(edition), /unsupported tactic.diagram.kind/);
  });
}

const validEdition = {
  date: '2026-10-17',
  weekday: '토요일',
  edition: '2026 WEEK 6 · 검증 발행본',
  sample: false,
  dek: '공식 원문과 경기 자료를 대조해 만든 검증 발행본입니다.',
  lead: {
    kicker: '오늘의 핵심',
    title: '이번 주말의 공격 구조를 바꾸는 핵심 변수',
    summary: '부상과 매치업 변화가 실제 플레이 설계에 미치는 영향을 설명합니다.',
  },
  sections: [
    {
      id: 'league-story',
      team: 'NFL',
      label: 'LEAGUE',
      title: '주요 선수 상태가 이번 주말 경기 설계를 바꾼다',
      summary: '공식 원문에서 확인한 핵심 사실을 충분히 설명합니다.',
      commentary: '이 변화가 실제 경기 설계에 미치는 의미를 구체적으로 설명합니다.',
      watch: '중계에서 확인할 선수 배치와 경기 흐름을 안내합니다.',
      sources: [{ label: '공식 출처', url: 'https://www.nfl.com/' }],
    },
  ],
  tactics: [
    {
      id: 'blitz-hot-read',
      team: 'NFL',
      label: 'OFFENSE 101',
      title: '압박이 만든 빈 공간을 빠르게 공략하는 전술',
      concept: '추가 수비수가 패스 러시에 참여하면서 비운 짧은 구역을 공격하는 전술입니다.',
      easy: '한쪽 문으로 사람이 몰린 순간 반대쪽 빈 문으로 빠르게 나가는 것과 같습니다.',
      gameUse: '스냅 전 수비 숫자와 스냅 후 실제 돌진 인원을 차례로 확인합니다.',
      diagram: { kind: 'blitz-hot-read', caption: '압박 반대편에 생기는 빈 공간과 핫 리드의 이동' },
      breakdown: [
        { label: '스냅 전', text: '쿼터백과 센터가 라인 근처에 선 수비수 숫자를 먼저 확인합니다.' },
        { label: '스냅 직후', text: '추가 러셔가 들어오고 어느 짧은 패스 구역이 비는지 확인합니다.' },
        { label: '공의 방향', text: '쿼터백이 압박 도착 전에 비어 있는 구역으로 빠르게 던집니다.' },
      ],
      whyItWorks: '수비가 압박 숫자를 늘리는 대가로 후방 커버 인원이 줄어들기 때문입니다.',
      defenseCounter: '수비는 압박처럼 보인 뒤 패스 길로 빠져 미리 정한 핫 리드를 차단합니다.',
      watchOrder: ['라인 근처 수비수 숫자', '스냅 후 실제 추가 러셔', '쿼터백의 첫 시선 방향'],
      source: { label: '공식 분석', url: 'https://www.nfl.com/' },
    },
  ],
  highlights: [],
  schedule: [
    {
      date: '10/19',
      weekday: '월',
      time: '02:00',
      status: '경기 예정',
      matchup: 'Jets at Patriots',
      note: '패트리어츠 공격의 블리츠 대응을 확인합니다.',
    },
  ],
  leagueWide: [
    {
      team: 'Broncos',
      label: 'BRONCOS',
      title: '주전 코너백 결장으로 외곽 수비에 큰 공백',
      why: '상대 공격이 깊은 일대일 패스를 더 적극적으로 시도할 수 있는 변화입니다.',
      url: 'https://www.nfl.com/',
    },
    {
      team: 'Bears',
      label: 'BEARS',
      title: '선발 쿼터백 복귀 여부가 공격 설계의 변수',
      why: '이동 능력과 빠른 패싱 비중이 달라져 경기 초반 운영에 직접 영향을 줍니다.',
      url: 'https://www.nfl.com/',
    },
  ],
};

test('prepare excludes historical duplicates, audits both collections and rebuilds headers without mutating input', () => {
  const prior = structuredClone(validEdition);
  const next = structuredClone(validEdition); next.date = '2026-10-18'; next.weekday = '일요일';
  next.sections.push({...next.sections[0], id:'fresh', title:'새로운 선수 계약과 다음 경기 준비 소식', summary:'이전에 보도되지 않은 새로운 선수 계약의 세부 내용입니다.', sources:[{label:'NFL',url:'https://www.nfl.com/news/fresh'}]});
  const original = structuredClone(next);
  const result = preparePublication([prior], next);
  assert.equal(result.report.status, 'ready');
  assert.equal(result.report.inputStoryCount, 4);
  assert.equal(result.report.outputStoryCount, 1);
  assert.deepEqual(result.report.exclusions.map(x=>[x.collection,x.index,x.previousDate]), [['sections',0,prior.date],['leagueWide',0,prior.date],['leagueWide',1,prior.date]]);
  assert.equal(result.edition.lead.title, next.sections[1].title);
  assert.equal(result.edition.lead.summary, next.sections[1].summary);
  assert.equal(result.edition.dek, next.sections[1].summary);
  assert.deepEqual(next, original);
  assert.doesNotThrow(()=>upsertEdition([prior], result.edition));
});

test('prepare retains strict validation even for stories that would be excluded', () => {
  for (const mutate of [e=>e.sections[0].sources=[], e=>e.sections[0].title='<bad>', e=>e.highlights=[{title:'invalid'}], e=>e.tactics[0].breakdown=[]]) {
    const next = structuredClone(validEdition); next.date='2026-10-18'; next.weekday='일요일'; mutate(next);
    assert.throws(()=>preparePublication([validEdition],next));
  }
  const repeated = structuredClone(validEdition); repeated.sections.push({...repeated.sections[0],id:'duplicate'});
  assert.throws(()=>preparePublication([],repeated),/within edition/);
});

test('prepare returns explicit no-new status for empty or fully excluded editions', () => {
  const next = structuredClone(validEdition); next.date='2026-10-18'; next.weekday='일요일';
  const excluded = preparePublication([validEdition],next);
  assert.equal(excluded.edition,null);
  assert.equal(excluded.report.status,'no-new-verified-stories');
  assert.equal(excluded.report.exclusions.length,3);
  next.sections=[]; next.leagueWide=[];
  assert.equal(preparePublication([],next).report.status,'no-new-verified-stories');
});

test('publication rejects a reworded event despite a new URL', () => {
  const prior = structuredClone(validEdition);
  prior.sections[0].eventKey = '2026-jets-qb-availability';
  const next = structuredClone(prior);
  next.date = '2026-10-18'; next.weekday = '일요일';
  next.sections[0].title = '다른 표현으로 다시 쓴 같은 선수 소식';
  next.sections[0].sources[0].url = 'https://www.nfl.com/news/new-story';
  assert.throws(() => upsertEdition([prior], next), /repeated event/i);
});

test('validateEdition accepts a sourced non-sample briefing', () => {
  assert.doesNotThrow(() => validateEdition(validEdition));
});

test('validateEdition rejects unsourced stories', () => {
  const invalid = structuredClone(validEdition);
  invalid.sections[0].sources = [];
  assert.throws(() => validateEdition(invalid), /source/i);
});

test('validateEdition rejects shallow tactics that outsource the explanation', () => {
  const invalid = structuredClone(validEdition);
  invalid.tactics[0].breakdown = [];
  assert.throws(() => validateEdition(invalid), /breakdown/i);
});

test('no new stories is a valid honest edition, without quotas', () => {
  const quiet = structuredClone(validEdition);
  quiet.sections = []; quiet.leagueWide = [];
  assert.doesNotThrow(() => validateEdition(quiet));
});

test('changed facts on the same source pass, mere update badges do not', () => {
  const prior = structuredClone(validEdition); prior.leagueWide = [];
  const story = prior.sections[0]; story.eventKey = '2026-qb-status';
  story.summary = '공식 보고서에서 선수는 훈련 제한 참가 상태로 확인됐습니다.';
  story.sources[0].url = 'https://www.nfl.com/news/injury-report';
  const next = structuredClone(prior); next.date = '2026-10-18'; next.weekday = '일요일';
  const updated = next.sections[0];
  updated.summary = '공식 보고서에서 선수는 최종 경기 결장 상태로 확인됐습니다.';
  updated.update = {kind: 'status-change', evidence: story.sources[0].url};
  assert.throws(() => upsertEdition([prior], next), /repeated event/);
  updated.changeSummary = '훈련 참가 상태에서 최종 출전 상태로 변경';
  updated.changeEvidence = {url: story.sources[0].url, before: '훈련 제한 참가', after: '최종 경기 결장', quote: '선수는 최종 경기 결장 상태입니다.'};
  assert.doesNotThrow(() => upsertEdition([prior], next));
  assert.equal(preparePublication([prior], next).report.outputStoryCount, 1);
  updated.changeEvidence.quote = '이전 보고서를 다시 인용했습니다.';
  assert.throws(() => upsertEdition([prior], next), /repeated event/);
});

test('optional NFL week metadata rejects calendar week 42', () => {
  assert.throws(() => validateEdition({...validEdition, season: 2026, seasonType: 'regular', week: 42}), /week/);
  assert.doesNotThrow(() => validateEdition({...validEdition, season: 2026, seasonType: 'postseason', week: 'super-bowl'}));
});

test('validateEdition rejects core-team filler in league-wide sidebar', () => {
  const invalid = structuredClone(validEdition);
  invalid.leagueWide[0].team = '49ers';
  assert.throws(() => validateEdition(invalid), /leagueWide/i);
});

test('validateEdition rejects markup in edition-derived text', () => {
  const invalid = structuredClone(validEdition);
  invalid.leagueWide[0].title = '<img src=x onerror=alert(1)>';
  assert.throws(() => validateEdition(invalid), /markup|html/i);
});

test('validateEdition rejects markup in weekday and optional tactic video metadata', () => {
  const badWeekday = structuredClone(validEdition);
  badWeekday.weekday = '<img src=x onerror=alert(1)>';
  assert.throws(() => validateEdition(badWeekday), /weekday.*markup|html/i);

  const badVideo = structuredClone(validEdition);
  badVideo.tactics[0].video = {
    title: '<svg onload=alert(1)>',
    type: '공식 분석 영상',
    url: 'https://www.youtube.com/watch?v=example',
  };
  assert.throws(() => validateEdition(badVideo), /video\.title.*markup|html/i);
});

test('validateEdition rejects shallow tactic and league-wide explanations', () => {
  const shallowTactic = structuredClone(validEdition);
  shallowTactic.tactics[0].whyItWorks = '짧음';
  assert.throws(() => validateEdition(shallowTactic), /meaningful|length/i);

  const shallowNews = structuredClone(validEdition);
  shallowNews.leagueWide[0].why = '짧음';
  assert.throws(() => validateEdition(shallowNews), /meaningful|length/i);
});

test('validateEdition rejects malformed schedule values and missing status', () => {
  for (const [field, value] of [['date', 'banana'], ['weekday', 'Funday'], ['time', '99:99'], ['status', '']]) {
    const invalid = structuredClone(validEdition);
    invalid.schedule[0][field] = value;
    assert.throws(() => validateEdition(invalid), new RegExp(`schedule\\.${field}`, 'i'));
  }
});

test('validateEdition rejects impossible calendar dates', () => {
  const badEditionDate = structuredClone(validEdition);
  badEditionDate.date = '2026-02-31';
  assert.throws(() => validateEdition(badEditionDate), /calendar date/i);

  const badGameDate = structuredClone(validEdition);
  badGameDate.schedule[0].date = '02/31';
  assert.throws(() => validateEdition(badGameDate), /schedule\.date.*calendar/i);
});

test('validateEdition rejects punctuation-only explanations', () => {
  const invalid = structuredClone(validEdition);
  invalid.tactics[0].whyItWorks = '...............';
  assert.throws(() => validateEdition(invalid), /substantive|meaningful/i);

  const badCaption = structuredClone(validEdition);
  badCaption.tactics[0].diagram.caption = '...............';
  assert.throws(() => validateEdition(badCaption), /diagram\.caption.*substantive|meaningful/i);

  const badHighlightTitle = structuredClone(validEdition);
  badHighlightTitle.highlights = [{
    title: '...............',
    channel: 'NFL',
    type: '공식 하이라이트',
    note: '경기 흐름과 핵심 매치업을 확인할 수 있는 공식 영상입니다.',
    url: 'https://www.youtube.com/watch?v=example',
  }];
  assert.throws(() => validateEdition(badHighlightTitle), /highlight\.title.*substantive|meaningful/i);

  const badHighlightNote = structuredClone(validEdition);
  badHighlightNote.highlights = [{
    title: '이번 경기의 핵심 장면을 모은 공식 하이라이트',
    channel: 'NFL',
    type: '공식 하이라이트',
    note: '...............',
    url: 'https://www.youtube.com/watch?v=example',
  }];
  assert.throws(() => validateEdition(badHighlightNote), /highlight\.note.*substantive|meaningful/i);
});

test('validateEdition rejects weekdays inconsistent with calendar dates', () => {
  const badEditionWeekday = structuredClone(validEdition);
  badEditionWeekday.weekday = '일요일';
  assert.throws(() => validateEdition(badEditionWeekday), /weekday.*calendar/i);

  const badScheduleWeekday = structuredClone(validEdition);
  badScheduleWeekday.schedule[0].weekday = '화';
  assert.throws(() => validateEdition(badScheduleWeekday), /schedule\.weekday.*calendar/i);
});

test('validateEdition rejects unsupported tactic diagrams', () => {
  const invalid = structuredClone(validEdition);
  invalid.tactics[0].diagram.kind = 'generic-arrows';
  assert.throws(() => validateEdition(invalid), /diagram\.kind|unsupported/i);
});

test('validateEdition normalizes core-team names before league-wide exclusion', () => {
  for (const team of ['49ers ', 'chiefs', ' PATRIOTS ']) {
    const invalid = structuredClone(validEdition);
    invalid.leagueWide[0].team = team;
    assert.throws(() => validateEdition(invalid), /leagueWide/i);
  }
});

test('upsertEdition replaces the same date and keeps newest first', () => {
  const old = { ...validEdition, date: '2026-10-16', weekday: '금요일', dek: '이전 날짜에 저장된 충분한 길이의 발행 설명입니다.' };
  const replacement = { ...validEdition, date: '2026-10-16', weekday: '금요일', dek: '같은 날짜를 교체하는 충분한 길이의 새 발행 설명입니다.' };
  const next = upsertEdition([old, { ...validEdition, date: '2026-10-15', weekday: '목요일', sample: true }], replacement);

  assert.deepEqual(next.map((item) => item.date), ['2026-10-16', '2026-10-15']);
  assert.equal(next[0].dek, '같은 날짜를 교체하는 충분한 길이의 새 발행 설명입니다.');
});
