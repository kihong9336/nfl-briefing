import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { highlightNote } from '../src/render-utils.js';
import { generateStaticPages } from '../src/static-pages.js';
import { briefings } from '../src/data.js';
import { validateEdition } from '../src/publish.js';

test('video captions may be omitted instead of padded with production explanations',()=>{
 const edition=structuredClone(briefings.find(b=>b.sample===false));
 for(const video of edition.highlights)delete video.note;
 assert.doesNotThrow(()=>validateEdition(edition));
});

test('highlight notes omit operating boilerplate but retain actual viewing pointers',()=>{
 assert.equal(highlightNote('2026 Week 7 전체 경기 하이라이트다. 경기 흐름을 확인하는 영상이며 특정 플레이의 시작 시점을 지정한 링크가 아니다.'),'');
 const useful='Stevenson의 전반 마지막 48야드 TD와 Raridon의 후반 30야드 TD를 함께 본다.';
 assert.equal(highlightNote(useful),useful);
 assert.equal(highlightNote(useful+' 영상은 해당 장면 바로가기가 아닌 전체 경기 하이라이트다.'),useful);
 assert.equal(highlightNote(undefined),'');
 assert.equal(highlightNote('업로드: 2026-10-27 00:19 KST'),'업로드: 2026-10-27 00:19 KST');
});
test('static and interactive views do not narrate display or verification mechanics',async()=>{
 const pages=generateStaticPages(briefings);
 for(const html of Object.values(pages))assert.doesNotMatch(html,/특정 플레이의 시작 시점을 지정한 링크가 아니다|이번 조사에서는 oEmbed|실제 운영 시에는/);
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(app+index,/팀 필터와 관계없이 표시합니다|상단 헤드라인에 나온 기사도 포함|등록 순서로 교차 표시/);
 assert.match(app,/highlightNote\(video.note\)/);
 const css=await readFile(new URL('../src/schedule-board.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/font:\s*\d+px[^;]*system-ui|h2\s*\{[^}]*font:/);
});
