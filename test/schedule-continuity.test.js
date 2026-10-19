import test from 'node:test';
import assert from 'node:assert/strict';
import { briefings } from '../src/data.js';
import { preparePublication, validateEdition } from '../src/publish.js';
import { carryForwardSchedule, scheduleDate } from '../src/schedule-continuity.js';

const game = (overrides = {}) => ({date:'10/23', weekday:'금', time:'09:15', status:'경기 예정', matchup:'New England Patriots at Chicago Bears', note:'이전에 확인한 경기 일정 안내입니다.', ...overrides});
const edition = (date, schedule, extra = {}) => ({date, sample:false, schedule, ...extra});

test('stable IDs override moved dates and latest cancellations block older planned rows', () => {
  const history = [edition('2026-10-18', [game({id:'moved'}), game({matchup:'KC at SEA', date:'10/26'})]),
    edition('2026-10-19', [game({matchup:'Kansas City Chiefs at Seattle Seahawks', date:'10/26', status:'취소'})])];
  const current = game({id:'moved', date:'10/24', time:'10:00', status:'연기'});
  assert.deepEqual(carryForwardSchedule(history, edition('2026-10-20', [current])), [current]);
});

test('same-day stale status stays unknown, provenance survives repeated carry and samples are ignored', () => {
  const original = game({date:'10/20', time:'00:01', source:{label:'official', url:'https://example.com', details:{verified:true}}});
  const history = [edition('2026-10-19',[original]), edition('2026-10-19',[game()],{sample:true})];
  const first = carryForwardSchedule(history, edition('2026-10-20', []));
  assert.equal(first.length, 1);
  assert.equal(first[0].status, '경기 예정');
  assert.match(first[0].note, /최종 결과 미확인/);
  assert.deepEqual(first[0].source, original.source);
  const second = carryForwardSchedule([edition('2026-10-20', first)], edition('2026-10-21', []));
  assert.equal(second.length, 0);
  const future = carryForwardSchedule([edition('2026-10-19',[game()])], edition('2026-10-20', []));
  const repeated = carryForwardSchedule([edition('2026-10-20',future)], edition('2026-10-21', []));
  assert.equal(repeated[0].lastConfirmedEdition,'2026-10-19');
  assert.equal(repeated[0].note, future[0].note);
});

test('validation resolves previous-month schedule dates in the same season', () => {
  const input = structuredClone(briefings.find(e=>e.sample === false));
  input.date = '2026-11-01'; input.weekday = '일요일';
  input.schedule = [game({date:'10/31',weekday:'토'})];
  assert.doesNotThrow(()=>validateEdition(input));
});

test('December to January uses source season dates, without resurrecting past December games', () => {
  assert.equal(scheduleDate(game({date:'12/31'}),'2027-01-01'),'2026-12-31');
  assert.equal(scheduleDate(game({date:'01/03'}),'2026-12-30'),'2027-01-03');
  const result = carryForwardSchedule([edition('2026-12-30',[game({date:'12/31'}),game({date:'01/03'})])],edition('2027-01-01',[]));
  assert.deepEqual(result.map(g=>g.date),['01/03']);
});


test('Oct 20 publication retains the four known upcoming games without mutating history or current input', () => {
  const input = structuredClone(briefings.find(e => e.date === '2026-10-20'));
  // Reproduce the original incomplete one-game input, independent of repaired live data.
  input.schedule = input.schedule.filter(g => g.date === '10/20');
  const history = structuredClone(briefings.filter(e => e.date < input.date));
  const before = JSON.stringify({input, history});
  const {edition} = preparePublication(history, input);
  assert.deepEqual(edition.schedule.map(g => g.date), ['10/20', '10/23', '10/26', '10/26']);
  assert.deepEqual(edition.schedule[0], input.schedule[0]);
  assert.equal(edition.schedule[1].lastConfirmedEdition, '2026-10-19');
  assert.equal(edition.schedule[1].carriedForward, true);
  assert.match(edition.schedule[1].note, /마지막 확인.*2026-10-19/);
  assert.equal(JSON.stringify({input, history}), before);
});
