#!/usr/bin/env python3
"""Commit/read a paired research artifact; hashes prove pairing, not factual truth."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1] / '.incoming'
KST = ZoneInfo('Asia/Seoul')

def digest(data):
    return hashlib.sha256(data).hexdigest()

def atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.' + path.name, dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)

def validate(edition, audit, now):
    today = now.strftime('%Y-%m-%d')
    if edition.get('date') != today or audit.get('date') != today:
        raise ValueError('edition/audit must match current KST date')
    if not isinstance(audit.get('runId'), str) or not audit['runId'].strip():
        raise ValueError('missing real runId')
    start, end = (dt.datetime.fromisoformat(audit[k]) for k in ('startedAt', 'completedAt'))
    if start.tzinfo is None or end.tzinfo is None:
        raise ValueError('timestamps must include timezone')
    if start.astimezone(KST).date() != now.date() or start.astimezone(KST).hour < 18:
        raise ValueError('research must start today at/after 18:00 KST')
    if not start <= end <= now or (now-start).total_seconds() > 21600:
        raise ValueError('stale or invalid run timestamps')
    for key in ('coverage', 'candidates', 'gameCoverage', 'retention'):
        if key not in audit or not isinstance(audit[key], (list, dict)):
            raise ValueError('missing structured audit.' + key)
    if not audit['gameCoverage']:
        raise ValueError('gameCoverage requires scoreboard evidence even on no-game day')
    for key in ('tactics', 'highlights'):
        item = audit.get('editorialCoverage', {}).get(key, {})
        if item.get('status') not in ('selected', 'unavailable') or not item.get('sources') or not item.get('reason'):
            raise ValueError('missing real editorial investigation: ' + key)
    return today

def seal(edition_path, audit_path):
    edata, adata = Path(edition_path).read_bytes(), Path(audit_path).read_bytes()
    edition, audit = json.loads(edata), json.loads(adata)
    date = validate(edition, audit, dt.datetime.now(KST))
    receipt = {k: audit[k] for k in ('date', 'runId', 'startedAt', 'completedAt')}
    receipt.update(editionSha256=digest(edata), auditSha256=digest(adata),
                   editionSource=str(Path(edition_path).resolve()), auditSource=str(Path(audit_path).resolve()))
    # Backup the previous complete handoff; never discard an earlier edition.
    backup = ROOT / 'handoff-history' / (date + '-' + dt.datetime.now(KST).strftime('%H%M%S%f'))
    for suffix in ('.json', '.audit.json', '.ready.json'):
        old = ROOT / (date + suffix)
        if old.exists():
            atomic(backup / old.name, old.read_bytes())
    atomic(ROOT / (date + '.json'), edata)
    atomic(ROOT / (date + '.audit.json'), adata)
    # Commit marker LAST: interrupted/mixed writes fail the reader's hashes.
    atomic(ROOT / (date + '.ready.json'), (json.dumps(receipt, ensure_ascii=False, indent=2)+'\n').encode())
    return check(date)

def check(date):
    receipt = json.loads((ROOT / (date + '.ready.json')).read_bytes())
    edata = (ROOT / (date + '.json')).read_bytes()
    adata = (ROOT / (date + '.audit.json')).read_bytes()
    if digest(edata) != receipt['editionSha256'] or digest(adata) != receipt['auditSha256']:
        raise ValueError('artifact/audit pair hash mismatch')
    edition, audit = json.loads(edata), json.loads(adata)
    if date != validate(edition, audit, dt.datetime.now(KST)):
        raise ValueError('requested date mismatch')
    if any(receipt.get(k) != audit.get(k) for k in ('date', 'runId', 'startedAt', 'completedAt')):
        raise ValueError('run provenance mismatch')
    return receipt

if __name__ == '__main__':
    try:
        if len(sys.argv) == 4 and sys.argv[1] == 'seal':
            result = seal(*sys.argv[2:])
        elif len(sys.argv) == 3 and sys.argv[1] == 'check':
            result = check(sys.argv[2])
        else:
            raise ValueError('usage: research-artifact.py seal edition.json audit.json | check YYYY-MM-DD')
        print(json.dumps(result, ensure_ascii=False))
    except (ValueError, KeyError, OSError, TypeError) as exc:
        print('ARTIFACT_INVALID: ' + str(exc), file=sys.stderr)
        sys.exit(1)
