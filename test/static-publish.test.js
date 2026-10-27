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
    for (const file of ['package.json', 'src/data.js', 'src/publish.js', 'src/schedule-continuity.js', 'src/publication-guard.js', 'src/video-policy.js', 'src/editorial-readiness.js', 'src/static-pages.js', 'src/tactic-reading-flow.js', 'src/tactic-visuals.js', 'src/render-utils.js', 'scripts/publish-edition.mjs', 'scripts/build-pages.mjs']) await cp(join(root, file), join(temp, file));
    execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: temp });
    const original = await readFile(join(temp, 'editions/index.html'), 'utf8');
    execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: temp });
    assert.equal(await readFile(join(temp, 'editions/index.html'), 'utf8'), original);
    const edition = structuredClone(briefings[0]);
    edition.sections = [edition.sections[0]]; edition.leagueWide = [];
    edition.sections[0].eventKey = 'test-unique-publish';
    edition.sections[0].summary = 'A unique factual test story for publication pipeline verification.';
    edition.date = '2026-10-18'; edition.weekday = '일요일'; edition.lead.title = '테스트 전용 발행 파이프라인 재생성 확인';
    await writeFile(join(temp, 'input.json'), JSON.stringify(edition));
    const followed = {date:edition.date, channels:[{status:'unavailable', channel:'픽다운'}], highlights:[{title:'큰일났다',channel:'미식축구 읽어주는 남자',channelId:'UCKF-sV1lgtP_exBfQ8cm9ag',videoId:'abcdefghijk',type:'채널 해설/리뷰',note:'채널의 해설/리뷰 영상이며 내용은 별도 요약하지 않았습니다.',url:'https://www.youtube.com/watch?v=abcdefghijk',publishedAt:'2026-10-18T01:00:00Z',evidence:{authorVerified:true,channelId:'UCKF-sV1lgtP_exBfQ8cm9ag',checkedAt:'2026-10-18T02:00:00Z',sourceURLs:['https://www.youtube.com/watch?v=abcdefghijk']}}]};
    await writeFile(join(temp,'followed.json'),JSON.stringify(followed));
    const output = execFileSync(process.execPath, ['scripts/publish-edition.mjs', 'input.json','--followed-videos','followed.json'], { cwd: temp, encoding: 'utf8' });
    assert.ok((await readFile(join(temp,'src/data.js'),'utf8')).includes('큰일났다'));
    const html = await readFile(join(temp, 'editions/2026-10-18/index.html'), 'utf8');
    assert.ok(html.includes(edition.lead.title));
    assert.ok((await readFile(join(temp, 'editions/index.html'), 'utf8')).includes('2026-10-18/'));
    assert.ok((await readFile(join(temp, 'src/data.js'), 'utf8')).includes(edition.lead.title));
    assert.ok(output.includes('git add -- src/data.js editions/'));
    assert.ok(output.includes('editions/2026-10-18/index.html'));
    const report = JSON.parse(await readFile(join(temp, 'input.publication-report.json'), 'utf8'));
    assert.equal(report.outputStoryCount, 1);
    assert.equal(report.status, 'published');
    // A same-day correction with an empty/failed channel check must retain confirmed videos.
    await writeFile(join(temp,'empty-followed.json'),JSON.stringify({date:edition.date,channels:[],highlights:[]}));
    execFileSync(process.execPath,['scripts/publish-edition.mjs','input.json','--followed-videos','empty-followed.json'],{cwd:temp,stdio:'pipe'});
    assert.ok((await readFile(join(temp,'src/data.js'),'utf8')).includes('큰일났다'));
    const publishedData = await readFile(join(temp, 'src/data.js'), 'utf8');
    edition.date = '2026-10-19'; edition.weekday = '월요일';
    const duplicateInput = JSON.stringify(edition);
    await writeFile(join(temp, 'input.json'), duplicateInput);
    assert.throws(()=>execFileSync(process.execPath, ['scripts/publish-edition.mjs', 'input.json'], {cwd:temp, stdio:'pipe'}));
    const emptyReport = JSON.parse(await readFile(join(temp, 'input.publication-report.json'), 'utf8'));
    assert.equal(emptyReport.status, 'no-new-verified-stories');
    assert.equal(emptyReport.inputStoryCount, 1);
    assert.equal(emptyReport.outputStoryCount, 0);
    assert.equal(emptyReport.exclusions[0].previousDate, '2026-10-18');
    assert.equal(await readFile(join(temp, 'src/data.js'), 'utf8'), publishedData);
    assert.equal(await readFile(join(temp, 'input.json'), 'utf8'), duplicateInput);
    edition.date='2026-10-23'; edition.weekday='금요일';
    edition.sections[0].eventKey='test-editorial-incomplete';
    edition.sections[0].summary='Another distinct publication test: missing lesson and film after a completed game.';
    edition.tactics=[]; edition.highlights=[];
    // Pin the completed-game condition instead of depending on the latest live edition.
    edition.schedule=[{...edition.schedule[0],gameDate:'2026-10-23',date:'10/23',weekday:'금',status:'종료'}];
    await writeFile(join(temp,'input.json'),JSON.stringify(edition));
    // Verified news must ship without an override even if optional film sections are incomplete.
    execFileSync(process.execPath,['scripts/publish-edition.mjs','input.json'],{cwd:temp,stdio:'pipe'});
    const partial=JSON.parse(await readFile(join(temp,'input.publication-report.json'),'utf8'));
    assert.equal(partial.status,'published-partial');
    assert.match(await readFile(join(temp,'editions/2026-10-23/index.html'),'utf8'),/일부 보완 중/);
    // Automatic production discovery is exercised offline with a deterministic helper.
    await mkdir(join(temp,'docs'));
    await writeFile(join(temp,'docs/followed-youtube-channels.json'),'{}');
    await writeFile(join(temp,'scripts/check-followed-channels.py'), 'import json,sys\nprint(json.dumps({"date":sys.argv[1],"channels":[],"highlights":[]}))\n');
    execFileSync(process.execPath,['scripts/publish-edition.mjs','input.json'],{cwd:temp,stdio:'pipe'});
    assert.equal(JSON.parse(await readFile(join(temp,'input.publication-report.json'),'utf8')).followedChannels.status,'checked');
    await writeFile(join(temp,'scripts/check-followed-channels.py'),'raise RuntimeError("fixture channel failure")\n');
    execFileSync(process.execPath,['scripts/publish-edition.mjs','input.json'],{cwd:temp,stdio:'pipe'});
    assert.equal(JSON.parse(await readFile(join(temp,'input.publication-report.json'),'utf8')).followedChannels.status,'unavailable');
  } finally { await rm(temp, { recursive: true, force: true }); }
});
