#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { briefings } from '../src/data.js';
import { serializeBriefings, upsertEdition } from '../src/publish.js';
import { buildPages } from './build-pages.mjs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/publish-edition.mjs <edition.json>');
  process.exit(2);
}

const absoluteInput = resolve(inputPath);
const edition = JSON.parse(await readFile(absoluteInput, 'utf8'));
const next = upsertEdition(briefings, edition);
const outputUrl = new URL('../src/data.js', import.meta.url);
await writeFile(outputUrl, serializeBriefings(next), 'utf8');

const generatedPaths = await buildPages(next);
console.log(`Published ${edition.date} into ${pathToFileURL(outputUrl.pathname).pathname}`);
console.log(`Generated static pages:\n${generatedPaths.join('\n')}`);
console.log('Stage the data AND all generated pages (including new dates): git add -- src/data.js editions/');
