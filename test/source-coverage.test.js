import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditSourceCoverage } from '../src/source-coverage.js';
const date = '2026-10-18';
const domains = ['espn.com', 'apnews.com', 'cbssports.com', 'nfl.com'];
const row = (domain, status = 'retrieved') => ({ name: domain, domain, status, url: `https://${domain}/story`, checkedAt: `${date}T12:00:00+09:00`, note: 'checked' });
test('www prefix and bare host are equivalent but other subdomains are not', () => {
 for(const domain of domains) {
  const data=audit(); const i=domains.indexOf(domain);data.coverage[i].url=`https://www.${domain}/news`;
  assert.equal(auditSourceCoverage(data).status,'complete');
  data.coverage[i].domain=`www.${domain}`;data.coverage[i].url=`https://${domain}/news`;
  assert.equal(auditSourceCoverage(data).status,'complete');
 }
 const data=audit();data.coverage[0].url='https://evil.espn.com/news';
 assert.throws(()=>auditSourceCoverage(data),/domain/);
});
test('official-only narrow audit rejected and repeated subdomains collapse', () => {
  assert.throws(() => auditSourceCoverage({ date, coverage: ['nfl.com', 'www.nfl.com', 'patriots.com', 'chiefs.com'].map(d => row(d)) }), /four|4/);
  const data = audit(); data.coverage.push(row('www.espn.com'));
  assert.equal(auditSourceCoverage(data).counts.attemptedFamilies, 4);
});
test('dated blocked attempts are partial; two independent retrievals suffice', () => {
  const data = audit(); data.coverage.forEach(r => { r.status = 'blocked'; });
  assert.equal(auditSourceCoverage(data).status, 'partial');
  data.coverage[0].status = 'retrieved';
  data.coverage.push(row('www.espn.com'));
  assert.equal(auditSourceCoverage(data).status, 'partial');
  data.coverage[1].status = 'retrieved';
  assert.equal(auditSourceCoverage(data).status, 'complete');
});
test('rejects spoofed/mismatched domains, HTTP, invalid status and missing failure note', () => {
  for (const change of [{ domain: 'espn.com.evil.test' }, { url: 'https://espn.com.evil.test' }, { url: 'http://espn.com' }, { status: '' }, { status: 'failed', note: '' }, { name: '' }]) {
    const data = audit(); Object.assign(data.coverage[0], change);
    assert.throws(() => auditSourceCoverage(data));
  }
  const data = audit(); data.coverage[0] = row('espn.com.evil.test');
  assert.throws(() => auditSourceCoverage(data), /4/);
});
test('rejects old audit dates, invalid dates, stale and future checks; accepts window edges', () => {
  assert.throws(() => auditSourceCoverage(audit(), { expectedDate: '2026-10-19' }), /date/i);
  assert.throws(() => auditSourceCoverage({ ...audit(), date: '2026-02-30' }), /date/i);
  for (const checkedAt of ['2026-10-16T23:59:59.998+09:00', '2026-10-19T00:00:00+09:00', 'garbage', '2026-10-18T12:00:00', '2026-02-30T12:00:00Z']) {
    const data = audit(); data.coverage[0].checkedAt = checkedAt;
    assert.throws(() => auditSourceCoverage(data), /checkedAt/i);
  }
  for (const checkedAt of ['2026-10-16T23:59:59.999+09:00', '2026-10-18T23:59:59.999+09:00']) {
    const data = audit(); data.coverage[0].checkedAt = checkedAt;
    assert.equal(auditSourceCoverage(data).status, 'complete');
  }
});
test('CLI emits content-free JSON, partial exits zero, date mismatch and bad input fail', () => {
  const dir = mkdtempSync(join(tmpdir(), 'coverage-'));
  const file = join(dir, 'audit.json');
  const run = args => spawnSync(process.execPath, [new URL('../scripts/check-source-coverage.mjs', import.meta.url).pathname, file, ...args], { encoding: 'utf8' });
  try {
    const data = audit(); data.coverage.forEach(r => { r.status = 'blocked'; r.note = 'PRIVATE-CONTENT'; });
    writeFileSync(file, JSON.stringify(data));
    const partial = run(['--date', date]);
    assert.equal(partial.status, 0, partial.stderr);
    assert.equal(JSON.parse(partial.stdout).status, 'partial');
    assert.ok(!partial.stdout.includes('PRIVATE-CONTENT'));
    assert.equal(run(['--date', '2026-10-19']).status, 1);
    writeFileSync(file, '{"SECRET-INVALID');
    const invalid = run([]);
    assert.equal(invalid.status, 1);
    assert.equal(JSON.parse(invalid.stdout).status, 'invalid');
    assert.ok(!invalid.stdout.includes('SECRET-INVALID'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
const audit = () => ({ date, coverage: domains.map(d => row(d)), candidates: [], decisions: [] });
test('current complete audit labels self-reported breadth, not correctness or exhaustiveness', () => {
  const result = auditSourceCoverage(audit(), { expectedDate: date });
  assert.equal(result.status, 'complete');
  assert.equal(result.counts.attemptedFamilies, 4);
  assert.equal(result.counts.retrievedFamilies, 4);
  assert.match(result.label, /self-reported/i);
  assert.match(result.warnings.join(' '), /exhaustive|exhaustiveness/i);
  assert.match(result.warnings.join(' '), /correctness/i);
});
