import test from 'node:test';
import assert from 'node:assert/strict';

import { upsertEdition, validateEdition } from '../src/publish.js';

const validEdition = {
  date: '2026-10-17',
  weekday: '토요일',
  edition: '2026 WEEK 6 · 검증 발행본',
  sample: false,
  dek: '검증된 발행본',
  lead: { kicker: '오늘의 핵심', title: '제목', summary: '요약' },
  sections: [
    {
      id: 'league-story',
      team: 'NFL',
      label: 'LEAGUE',
      title: '뉴스',
      summary: '사실',
      commentary: '해설',
      watch: '볼 것',
      sources: [{ label: '공식 출처', url: 'https://www.nfl.com/' }],
    },
  ],
  tactics: [],
  highlights: [],
  schedule: [],
};

test('validateEdition accepts a sourced non-sample briefing', () => {
  assert.doesNotThrow(() => validateEdition(validEdition));
});

test('validateEdition rejects unsourced stories', () => {
  const invalid = structuredClone(validEdition);
  invalid.sections[0].sources = [];
  assert.throws(() => validateEdition(invalid), /source/i);
});

test('upsertEdition replaces the same date and keeps newest first', () => {
  const old = { ...validEdition, date: '2026-10-16', dek: 'old' };
  const replacement = { ...validEdition, date: '2026-10-16', dek: 'new' };
  const next = upsertEdition([old, { ...validEdition, date: '2026-10-15' }], replacement);

  assert.deepEqual(next.map((item) => item.date), ['2026-10-16', '2026-10-15']);
  assert.equal(next[0].dek, 'new');
});
