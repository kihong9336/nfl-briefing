#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { auditSourceCoverage } from '../src/source-coverage.js';

try {
  const [file, ...args] = process.argv.slice(2);
  if (!file || file.startsWith('--') || !(args.length === 0 || (args.length === 2 && args[0] === '--date'))) {
    throw new Error('Usage: node scripts/check-source-coverage.mjs AUDIT.json [--date YYYY-MM-DD]');
  }
  let artifact;
  try { artifact = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error('Unable to read audit JSON.'); }
  console.log(JSON.stringify(auditSourceCoverage(artifact, { expectedDate: args[1] }), null, 2));
} catch (error) {
  console.log(JSON.stringify({ status: 'invalid', label: 'Self-reported source coverage audit', counts: null, warnings: [error.message] }, null, 2));
  process.exitCode = 1;
}
