#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { briefings } from '../src/data.js';
import { serializeBriefings, upsertEdition } from '../src/publish.js';

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

console.log(`Published ${edition.date} into ${pathToFileURL(outputUrl.pathname).pathname}`);
