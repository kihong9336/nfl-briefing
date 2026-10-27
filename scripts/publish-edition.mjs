#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

import { briefings } from '../src/data.js';
import { preparePublication, serializeBriefings, upsertEdition } from '../src/publish.js';
import { applyVideoPolicy } from '../src/video-policy.js';
import { editorialReadiness } from '../src/editorial-readiness.js';
import { buildPages } from './build-pages.mjs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/publish-edition.mjs <edition.json>');
  process.exit(2);
}

const absoluteInput = resolve(inputPath);
const input = JSON.parse(await readFile(absoluteInput, 'utf8'));
const followedAudit = {status:'skipped', channels:[], warnings:[]};
const approved = new Map([['UCKF-sV1lgtP_exBfQ8cm9ag','미식축구 읽어주는 남자'],['UC-XSuyEOJh7mXukcuax2KvA','픽다운']]);
const flag = process.argv.indexOf('--followed-videos');
const helper = new URL('./check-followed-channels.py', import.meta.url);
const config = new URL('../docs/followed-youtube-channels.json', import.meta.url);
function directId(url) {
  try { const u = new URL(url); if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : ['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname) ? u.pathname === '/watch' && u.searchParams.getAll('v').length === 1 ? u.searchParams.get('v') : u.pathname.startsWith('/shorts/') ? u.pathname.slice(8) : null : null;
    return /^[A-Za-z0-9_-]{11}$/.test(id ?? '') ? id : null;
  } catch { return null; }
}
// Retain verified channel videos already public on this date during corrections.
for (const existing of briefings.filter(e => e.sample === false && e.date === input.date).flatMap(e => e.highlights ?? [])) {
  if (approved.get(existing.channelId) === existing.channel && directId(existing.url) && !(input.highlights ?? []).some(v => directId(v.url) === directId(existing.url))) {
    input.highlights ??= [];
    input.highlights.push(structuredClone(existing));
  }
}
try {
  let manifest;
  if (flag >= 0) {
    if (!process.argv[flag+1] || process.argv[flag+1].startsWith('--')) throw new Error('--followed-videos needs a file');
    manifest = JSON.parse(await readFile(resolve(process.argv[flag+1]), 'utf8'));
  } else if (!process.argv.includes('--skip-followed') && existsSync(helper) && existsSync(config)) {
    const result = spawnSync('python3', [helper.pathname, input.date, '--timeout', '25'], {encoding:'utf8', timeout:35000, maxBuffer:5*1024*1024});
    if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? 'collector failed');
    manifest = JSON.parse(result.stdout);
  }
  if (manifest) {
    if (manifest.date !== input.date || !Array.isArray(manifest.highlights) || !Array.isArray(manifest.channels)) throw new Error('invalid followed manifest date/schema');
    followedAudit.status = 'checked'; followedAudit.channels = manifest.channels;
    followedAudit.checkedAt = manifest.checkedAt; followedAudit.since = manifest.since;
    const prior = briefings.filter(e => e.sample === false && e.date < input.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const cutoff = Date.parse(prior ? prior.date+'T20:00:00+09:00' : input.date+'T20:00:00+09:00') - (prior ? 0 : 7*86400000);
    const sameDay = new Set(briefings.filter(e=>e.sample===false && e.date===input.date).flatMap(e=>e.highlights ?? []).map(v=>directId(v.url)));
    const seen = new Set([...briefings.filter(e=>e.sample===false && e.date!==input.date).flatMap(e=>e.highlights ?? []), ...(input.highlights ?? [])].map(v=>directId(v.url)));
    for (const video of manifest.highlights) {
      const id = directId(video.url), stamp = Date.parse(video.publishedAt), checked = Date.parse(video.evidence?.checkedAt);
      if (!id || id !== video.videoId || approved.get(video.channelId) !== video.channel || video.evidence?.channelId !== video.channelId || video.evidence?.authorVerified !== true || !Array.isArray(video.evidence?.sourceURLs) || !video.evidence.sourceURLs.includes(video.url) || !Number.isFinite(checked) || !Number.isFinite(stamp) || stamp > Date.now() || stamp > Date.parse(input.date+'T23:59:59+09:00') || (stamp <= cutoff && !sameDay.has(id)) || !['title','type','note'].every(k=>typeof video[k]==='string' && !/[<>]/.test(video[k])) || video.title.trim().length<1 || video.type.length<3 || video.note.length<15) {
        followedAudit.warnings.push('Rejected unverified/old/future followed video: '+JSON.stringify(video.videoId)); continue;
      }
      if (seen.has(id) && !sameDay.has(id) || (input.highlights ?? []).some(v=>directId(v.url)===id)) continue;
      input.highlights.push(video); seen.add(id);
    }
    for (const channel of manifest.channels) if (channel.status !== 'ok') followedAudit.warnings.push('Followed channel '+channel.channel+': '+channel.status);
  }
} catch (error) { followedAudit.status='unavailable'; followedAudit.warnings.push('Followed videos unavailable; verified news continues: '+error.message); }
for (const warning of followedAudit.warnings) console.warn(warning);
const prepared = preparePublication(briefings, input);
prepared.report.followedChannels = followedAudit;
const suffix = extname(absoluteInput);
const reportPath = (suffix ? absoluteInput.slice(0, -suffix.length) : absoluteInput) + '.publication-report.json';
await writeFile(reportPath, JSON.stringify(prepared.report, null, 2) + '\n', 'utf8');
for (const exclusion of prepared.report.exclusions) console.warn(`Excluded ${JSON.stringify(exclusion)}`);
if (!prepared.edition) {
  console.error('No new verified stories: publication not performed. See ' + reportPath);
  process.exit(3);
}
const { edition, warnings } = applyVideoPolicy(prepared.edition);
for (const warning of warnings) console.warn(warning);
const editorial = editorialReadiness(edition);
if (editorial.status === 'needs-review') {
  console.warn('Verified news is publishing first; follow-up needed: '+editorial.missing.join(', '));
  edition.editorialNotice='일부 보완 중: '+editorial.missing.join(' · ')+'. 확인된 뉴스만 먼저 제공합니다.';
  edition.dek=edition.editorialNotice+' '+edition.dek;
} else {
  delete edition.editorialNotice;
}
const next = upsertEdition(briefings, edition);
const outputUrl = new URL('../src/data.js', import.meta.url);
await writeFile(outputUrl, serializeBriefings(next), 'utf8');

const generatedPaths = await buildPages(next);
await writeFile(reportPath, JSON.stringify({...prepared.report, status: editorial.status === 'needs-review' ? 'published-partial' : 'published', editorial, videoWarnings: warnings}, null, 2) + '\n', 'utf8');
console.log(`${editorial.status === 'needs-review' ? 'Published PARTIAL edition' : 'Published'} ${edition.date} into ${pathToFileURL(outputUrl.pathname).pathname}`);
console.log(`Generated static pages:\n${generatedPaths.join('\n')}`);
console.log('Stage the data AND all generated pages (including new dates): git add -- src/data.js editions/');
