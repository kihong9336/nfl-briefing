#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {validateHandoff} from '../src/handoff.js';
const [inputPath,auditPath,...args]=process.argv.slice(2);
try {
  const option = name => args[args.indexOf(name)+1];
  if (!inputPath || !auditPath || !args.includes('--date') || !args.includes('--not-before')) throw new Error('Usage: check-handoff.mjs input.json audit.json --date YYYY-MM-DD --not-before ISO');
  const [input,audit]=await Promise.all([inputPath,auditPath].map(async p=>JSON.parse(await readFile(p,'utf8'))));
  console.log(JSON.stringify(validateHandoff(input,audit,{date:option('--date'),notBefore:option('--not-before')})));
} catch(error) { console.error(error.message);process.exitCode=1; }
