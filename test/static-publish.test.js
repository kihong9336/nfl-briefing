import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { briefings } from '../src/data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
test('build is deterministic and publisher automatically regenerates all static pages after upsert', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'nfl-static-'));
  try {
    for (const dir of ['src', 'scripts']) await mkdir(join(temp, dir));
    for (const file of ['package.json', 'src/data.js', 'src/publish.js', 'src/static-pages.js', 'scripts/publish-edition.mjs', 'scripts/build-pages.mjs']) await cp(join(root, file), join(temp, file));
    execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: temp });
    const original = await readFile(join(temp, 'editions/index.html'), 'utf8');
    execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: temp });
    assert.equal(await readFile(join(temp, 'editions/index.html'), 'utf8'), original);
    const edition = structuredClone(briefings[0]);
    edition.date = '2026-10-18'; edition.weekday = '일요일'; edition.lead.title = '테스트 전용 발행 파이프라인 재생성 확인';
    await writeFile(join(temp, 'input.json'), JSON.stringify(edition));
    const output = execFileSync(process.execPath, ['scripts/publish-edition.mjs', 'input.json'], { cwd: temp, encoding: 'utf8' });
    const html = await readFile(join(temp, 'editions/2026-10-18/index.html'), 'utf8');
    assert.ok(html.includes(edition.lead.title));
    assert.ok((await readFile(join(temp, 'editions/index.html'), 'utf8')).includes('2026-10-18/'));
    assert.ok((await readFile(join(temp, 'src/data.js'), 'utf8')).includes(edition.lead.title));
    assert.ok(output.includes('git add -- src/data.js editions/'));
    assert.ok(output.includes('editions/2026-10-18/index.html'));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
