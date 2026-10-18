import test from 'node:test';
import assert from 'node:assert/strict';
import { applyVideoPolicy, isDirectYouTubeVideo } from '../src/video-policy.js';
import { upsertEdition } from '../src/publish.js';

test('accept only direct HTTPS YouTube video formats', () => {
  for (const url of ['https://youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=2', 'https://m.youtube.com/shorts/dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ']) {
    assert.equal(isDirectYouTubeVideo(url), true, url);
    const input = { highlights: [{ url }], tactics: [{ video: { url } }] };
    assert.deepEqual(applyVideoPolicy(input), { edition: input, warnings: [] });
  }
  for (const url of [null, 123, '', 'http://youtu.be/dQw4w9WgXcQ', 'https://youtube.com/@NFL', 'https://youtube.com/results?search_query=NFL', 'https://youtube.com/playlist?list=x', 'https://youtube.com/watch?v=short', 'https://youtube.com/watch?v=dQw4w9WgXcQ0', 'https://youtube.com/watch?v=dQw4w9WgXcQ&v=bad', 'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com@evil.com/watch?v=dQw4w9WgXcQ', 'https://user:secret@youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ/extra', 'https://youtube.com/embed/dQw4w9WgXcQ', 'https://youtube.com:444/watch?v=dQw4w9WgXcQ']) {
    assert.equal(isDirectYouTubeVideo(url), false, String(url));
  }
});

test('remove only invalid optional tactic video, retaining lesson, text and sources', () => {
  const input = { highlights: [], sections: [{ title: 'News', sources: [{ url: 'https://www.nfl.com/news/story' }] }], tactics: [{ title: 'Lesson', concept: 'Keep the teaching text', source: { url: 'https://www.nfl.com/analysis' }, video: { title: 'Film lesson', url: 'https://www.nfl.com/videos/film' } }, { title: 'No video lesson' }] };
  const before = structuredClone(input);
  const { edition, warnings } = applyVideoPolicy(input);
  assert.deepEqual(input, before);
  const expected = structuredClone(before);
  delete expected.tactics[0].video;
  assert.deepEqual(edition, expected);
  assert.match(warnings.join('\n'), /video unavailable.*Lesson/i);
  assert.equal(warnings.length, 1);
});

const video = { title: 'Official game highlights', channel: 'NFL', type: 'Highlights', note: 'The complete key moments of this football game.', url: 'https://www.nfl.com/videos/game?token=PRIVATE' };
const news = { date: '2026-10-19', weekday: '월요일', sample: false, edition: 'Daily NFL briefing', dek: 'A fully sourced daily football briefing.', lead: { kicker: 'NFL news', title: 'Important football news today', summary: 'All the important facts from the football league today.' }, sections: [], leagueWide: [], tactics: [], schedule: [], highlights: [video] };

test('omit official-site fallback without mutating input or blocking news', () => {
  const original = structuredClone(news);
  const { edition, warnings } = applyVideoPolicy(news);
  assert.deepEqual(news, original);
  assert.notEqual(edition, news);
  assert.deepEqual(edition.highlights, []);
  assert.match(warnings.join('\n'), /video unavailable.*Official game highlights/i);
  assert.doesNotMatch(warnings.join('\n'), /PRIVATE|https:/);
  assert.deepEqual(edition.lead, news.lead);
  assert.doesNotThrow(() => upsertEdition([], edition));
});
