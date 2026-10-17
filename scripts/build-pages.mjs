#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { briefings } from '../src/data.js';
import { generateStaticPages } from '../src/static-pages.js';

export async function buildPages(editions = briefings, root = fileURLToPath(new URL('../', import.meta.url))) {
  // Render and validate the entire archive before any file is written.
  const pages = generateStaticPages(editions);
  for (const [path, html] of Object.entries(pages)) {
    const target = resolve(root, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
  }
  return Object.keys(pages);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = await buildPages();
  console.log(`Generated ${paths.length} static pages:\n${paths.join('\n')}`);
}
