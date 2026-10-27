#!/usr/bin/env python3
"""Verified YouTube uploads. Stdlib only; stdout manifest, no publication writes."""
import argparse
import concurrent.futures
import datetime as dt
import json
import pathlib
import re
import subprocess
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

CHANNELS = [
    {'id': 'UCKF-sV1lgtP_exBfQ8cm9ag', 'handle': 'ireadfootball', 'name': '미식축구 읽어주는 남자'},
    {'id': 'UC-XSuyEOJh7mXukcuax2KvA', 'handle': 'peakdown_NFL', 'name': '픽다운'},
]
KST = dt.timezone(dt.timedelta(hours=9))
ROOT = pathlib.Path(__file__).resolve().parents[1]


def valid_id(value):
    return isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_-]{11}', value) is not None


def parse_time(value):
    stamp = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if stamp.tzinfo is None:
        raise ValueError('timestamp requires timezone')
    return stamp


def video_id(url):
    parsed = urllib.parse.urlparse(url or '')
    if parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port:
        return None
    if parsed.hostname == 'youtu.be':
        value = parsed.path[1:]
    elif parsed.hostname in ('youtube.com', 'www.youtube.com', 'm.youtube.com'):
        values = urllib.parse.parse_qs(parsed.query).get('v', [])
        value = values[0] if parsed.path == '/watch' and len(values) == 1 else parsed.path[8:] if parsed.path.startswith('/shorts/') else ''
    else:
        return None
    return value if valid_id(value) else None


def extract_json(text, name):
    for match in re.finditer(re.escape(name) + r'\s*(?:"\])?\s*=\s*', text):
        try:
            return json.JSONDecoder().raw_decode(text[match.end():])[0]
        except ValueError:
            pass
    return {}


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def collect(date, history, fetch, since=None, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    end = min(now, parse_time(date + 'T23:59:59+09:00'))
    previous = sorted(e['date'] for e in history if e.get('sample') is False and e['date'] < date)
    cutoff = parse_time(since) if since else parse_time(previous[-1] + 'T20:00:00+09:00') if previous else parse_time(date + 'T20:00:00+09:00') - dt.timedelta(days=7)
    seen = {video_id(v.get('url')) for e in history if e.get('sample') is False and e['date'] != date for v in e.get('highlights', [])}
    retained = {video_id(v.get('url')) for e in history if e.get('sample') is False and e['date'] == date for v in e.get('highlights', [])}
    checked = now.isoformat()

    def channel_check(channel):
        sources, errors, skipped, highlights, inspected = [], [], [], [], []
        def get(url):
            sources.append(url)
            return fetch(url)
        candidates = []
        feed_url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channel['id']
        try:
            root = ET.fromstring(get(feed_url))
            ns = {'a':'http://www.w3.org/2005/Atom', 'yt':'http://www.youtube.com/xml/schemas/2015'}
            if root.findtext('yt:channelId', namespaces=ns) != channel['id'] and root.findtext('a:author/a:uri', namespaces=ns) != 'https://www.youtube.com/channel/' + channel['id']:
                raise ValueError('feed channel ID/author mismatch')
            for entry in root.findall('a:entry', ns):
                candidates.append((entry.findtext('yt:videoId', namespaces=ns), entry.findtext('a:title', namespaces=ns), entry.findtext('a:published', namespaces=ns)))
        except Exception as exc:
            errors.append('RSS: ' + str(exc))
            try:
                page = get('https://www.youtube.com/@' + channel['handle'] + '/videos')
                data = extract_json(page, 'ytInitialData')
                for item in walk(data):
                    lockup = item.get('lockupViewModel', {})
                    if lockup.get('contentType') == 'LOCKUP_CONTENT_TYPE_VIDEO':
                        candidates.append((lockup.get('contentId'), lockup.get('metadata', {}).get('lockupMetadataViewModel', {}).get('title', {}).get('content'), None))
                    renderer = item.get('videoRenderer')
                    if renderer and not renderer.get('upcomingEventData'):
                        title = renderer.get('title', {})
                        candidates.append((renderer.get('videoId'), title.get('simpleText') or ''.join(run.get('text', '') for run in title.get('runs', [])), None))
                if not candidates:
                    raise ValueError('no actual video renderers available')
            except Exception as exc:
                errors.append('channel HTML: ' + str(exc))
        unique = set()
        for vid, title, published in candidates[:8]:
            if not valid_id(vid) or vid in unique:
                continue
            unique.add(vid)
            if vid in seen and vid not in retained:
                skipped.append({'videoId':vid, 'reason':'previously-published'})
                continue
            url = 'https://www.youtube.com/watch?v=' + vid
            try:
                if published and (parse_time(published) > end or (parse_time(published) <= cutoff and vid not in retained)):
                    continue
                page = get(url)
                player = extract_json(page, 'ytInitialPlayerResponse')
                details = player.get('videoDetails', {})
                micro = player.get('microformat', {}).get('playerMicroformatRenderer', {})
                if details.get('videoId') not in (None, vid):
                    raise ValueError('watch video ID mismatch')
                if details.get('isUpcoming') or player.get('playabilityStatus', {}).get('status') == 'LIVE_STREAM_OFFLINE':
                    raise ValueError('upcoming video/live')
                live = micro.get('liveBroadcastDetails', {})
                if live and (not live.get('startTimestamp') or parse_time(live['startTimestamp']) > end):
                    raise ValueError('live not started')
                verified = details.get('channelId') == channel['id']
                if not verified:
                    embed = json.loads(get('https://www.youtube.com/oembed?url=' + urllib.parse.quote(url, safe='') + '&format=json'))
                    author = embed.get('author_url', '').rstrip('/')
                    verified = author in ('https://www.youtube.com/@' + channel['handle'], 'https://www.youtube.com/channel/' + channel['id'])
                    if not title:
                        title = embed.get('title')
                if not verified:
                    raise ValueError('unverified channel author')
                published = published or micro.get('publishDate') or micro.get('uploadDate')
                if not published:
                    raise ValueError('publish date unavailable')
                stamp = parse_time(published)  # Date-only metadata is not an invented midnight timestamp.
                inspected.append({'videoId':vid, 'title':title, 'publishedAt':stamp.isoformat(), 'authorVerified':True, 'url':url, 'eligible':stamp <= end and (stamp > cutoff or vid in retained)})
                if stamp > end or (stamp <= cutoff and vid not in retained):
                    continue
                if not isinstance(title, str) or len(title.strip()) < 1 or re.search('[<>]', title):
                    raise ValueError('original title unavailable or unsupported')
                highlights.append({'title':title, 'channel':channel['name'], 'channelId':channel['id'], 'videoId':vid,
                    'type':'채널 해설/리뷰', 'note':'업로드: '+stamp.astimezone(KST).strftime('%Y-%m-%d %H:%M KST')+' · '+channel['name']+'의 NFL 영상.',
                    'url':url, 'publishedAt':stamp.isoformat(), 'evidence':{'checkedAt':checked, 'sourceURLs':list(sources), 'authorVerified':True, 'channelId':channel['id']}})
            except Exception as exc:
                skipped.append({'videoId':vid, 'reason':str(exc)})
        status = 'ok' if candidates and not skipped else 'partial' if highlights else 'unavailable' if not candidates or any(s['reason'] != 'previously-published' for s in skipped) else 'ok'
        return highlights, {'channelId':channel['id'], 'channel':channel['name'], 'status':status, 'checkedAt':checked, 'sourceURLs':sources, 'errors':errors, 'skipped':skipped, 'inspected':inspected}

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(channel_check, CHANNELS))
    return {'version':1, 'date':date, 'checkedAt':checked, 'since':cutoff.isoformat(), 'cutoffPolicy':'previous public edition at 20:00 KST; first run 7 days',
            'highlights':[v for videos, _ in results for v in videos], 'channels':[audit for _, audit in results]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('date')
    parser.add_argument('--since')
    parser.add_argument('--output')
    parser.add_argument('--timeout', type=float, default=25)
    args = parser.parse_args()
    dt.date.fromisoformat(args.date)
    config = json.loads((ROOT / 'docs/followed-youtube-channels.json').read_text())
    if config['channels'] != CHANNELS:
        raise ValueError('channel config must exactly match approved channels')
    history = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {briefings} from './src/data.js'; console.log(JSON.stringify(briefings))"], cwd=ROOT, timeout=3))
    deadline = time.monotonic() + min(args.timeout, 25)
    def fetch(url):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('global collection deadline reached')
        request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0', 'Accept-Language':'ko-KR,ko;q=0.9'})
        with urllib.request.urlopen(request, timeout=min(5, remaining)) as response:
            return response.read(5_000_000).decode('utf-8')
    manifest = collect(args.date, history, fetch, args.since)
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        path = pathlib.Path(args.output)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
    else:
        print(text, end='')

if __name__ == '__main__':
    main()
