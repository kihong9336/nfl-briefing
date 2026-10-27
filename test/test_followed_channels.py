import importlib.util
import pathlib
import unittest

PATH = pathlib.Path(__file__).resolve().parents[1] / 'scripts/check-followed-channels.py'

class CollectorTests(unittest.TestCase):
    def test_collector_exists_and_rejects_invalid_video_id(self):
        self.assertTrue(PATH.exists(), 'followed channel collector must exist')
        spec = importlib.util.spec_from_file_location('collector', PATH)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.assertFalse(module.valid_id('invalid'))
        self.assertTrue(module.valid_id('MBm8SXHefAU'))

    def test_fixture_collection_verification_cutoff_and_failure(self):
        spec = importlib.util.spec_from_file_location('collector', PATH)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        channel = module.CHANNELS[0]
        feed = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015"><yt:channelId>'+channel['id']+'</yt:channelId><entry><yt:videoId>MBm8SXHefAU</yt:videoId><title>큰일났다</title><published>2026-10-26T15:19:55Z</published></entry></feed>'
        def fetch(url):
            if channel['id'] in url: return feed
            if 'watch?' in url: return 'var ytInitialPlayerResponse = '+__import__('json').dumps({'videoDetails':{'videoId':'MBm8SXHefAU','channelId':channel['id']}})+';'
            raise OSError('fixture feed unavailable')
        result = module.collect('2026-10-27', [], fetch, now=module.parse_time('2026-10-27T10:00:00Z'))
        self.assertEqual(len(result['highlights']), 1)
        self.assertEqual(result['channels'][1]['status'], 'unavailable')
        self.assertEqual(result['highlights'][0]['title'], '큰일났다')
        self.assertIn('2026-10-27 00:19 KST', result['highlights'][0]['note'])
        history = [{'date':'2026-10-26', 'sample':False, 'highlights':result['highlights']}]
        self.assertEqual(module.collect('2026-10-27', history, fetch, now=module.parse_time('2026-10-27T10:00:00Z'))['highlights'], [])
        history[0]['date'] = '2026-10-27'
        self.assertEqual(len(module.collect('2026-10-27', history, fetch, now=module.parse_time('2026-10-27T10:00:00Z'))['highlights']), 1)
        future = feed.replace('2026-10-26T15:19:55Z', '2026-10-28T15:19:55Z')
        self.assertEqual(module.collect('2026-10-27', [], lambda url: future if 'feeds/' in url else fetch(url), now=module.parse_time('2026-10-27T10:00:00Z'))['highlights'], [])

    def test_canonical_feed_author_and_modern_channel_fallback(self):
        import json
        spec = importlib.util.spec_from_file_location('collector', PATH)
        c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
        channel = c.CHANNELS[1]
        def fetch(url):
            if 'feeds/' in url: raise OSError('404')
            if '/videos' in url: return 'var ytInitialData = '+json.dumps({'lockupViewModel':{'contentType':'LOCKUP_CONTENT_TYPE_VIDEO','contentId':'abcdefghijk','metadata':{'lockupMetadataViewModel':{'title':{'content':'Original fallback title'}}}}})+';'
            if 'watch?' in url: return 'var ytInitialPlayerResponse = '+json.dumps({'videoDetails':{'videoId':'abcdefghijk','channelId':channel['id']},'microformat':{'playerMicroformatRenderer':{'publishDate':'2026-10-27T01:00:00Z'}}})+';'
            raise OSError('no author')
        result = c.collect('2026-10-27', [], fetch, now=c.parse_time('2026-10-27T10:00:00Z'))
        self.assertEqual(len(result['highlights']),1)
        self.assertEqual(result['highlights'][0]['channelId'],channel['id'])

    def test_rejects_unknown_author_upcoming_and_unknown_date(self):
        import json
        spec = importlib.util.spec_from_file_location('collector', PATH)
        c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
        self.assertIsNone(c.video_id('https://evil.example/watch?v=abcdefghijk'))
        for details, micro in [({'channelId':'other'}, {'publishDate':'2026-10-27T01:00:00Z'}), ({'channelId':c.CHANNELS[0]['id'],'isUpcoming':True}, {'publishDate':'2026-10-27T01:00:00Z'}), ({'channelId':c.CHANNELS[0]['id']}, {})]:
            def fetch(url):
                if 'feeds/' in url: raise OSError('404')
                if '/videos' in url: return 'var ytInitialData = '+json.dumps({'videoRenderer':{'videoId':'abcdefghijk','title':{'simpleText':'Original fixture title'}}})+';'
                if 'watch?' in url: return 'var ytInitialPlayerResponse = '+json.dumps({'videoDetails':details,'microformat':{'playerMicroformatRenderer':micro}})+';'
                return json.dumps({'author_url':'https://www.youtube.com/@impostor'})
            self.assertEqual(c.collect('2026-10-27', [], fetch, now=c.parse_time('2026-10-27T10:00:00Z'))['highlights'], [])

if __name__ == '__main__':
    unittest.main()
