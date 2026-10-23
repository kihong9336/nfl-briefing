#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
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
const prepared = preparePublication(briefings, input);
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
  if (!process.argv.includes('--partial')) {
    await writeFile(reportPath, JSON.stringify({...prepared.report,status:'needs-editorial-repair',editorial},null,2)+'\n');
    console.error('Editorial repair required: '+editorial.missing.join(', ')+'. Repair first; --partial publishes an explicitly incomplete edition.');
    process.exit(4);
  }
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
