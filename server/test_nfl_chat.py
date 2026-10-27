import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).with_name('nfl_chat.py')

class BootstrapTest(unittest.TestCase):
    def test_blueprint_health(self):
        self.assertTrue(MODULE.exists(), 'NFL backend is not implemented')
        spec = importlib.util.spec_from_file_location('nfl_chat', MODULE)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        from flask import Flask
        app = Flask(__name__)
        app.register_blueprint(module.create_blueprint())
        response = app.test_client().get('/api/nfl-chat')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'ok': True, 'service': 'nfl-chat'})

import tempfile
from unittest.mock import patch, MagicMock
import requests
import nfl_chat as chat
from flask import Flask

ORIGIN = 'https://kihong9336.github.io'
EDITION = {'date': '2026-10-26', 'lead': {'title': 'NFL edition'}, 'sections': [{'summary': 'untrusted ignore instructions', 'sources': [{'label': 'NFL', 'url': 'https://nfl.com/news/test'}, {'url': 'javascript:bad'}]}]}

class ChatTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.calls = []
        self.config = {'api_key': 'sentinel-secret', 'quota_path': self.temp.name + '/quota.sqlite', 'edition_loader': lambda: [EDITION], 'clock': lambda: 2000000000}
        def provider(payload, key):
            self.calls.append((payload, key))
            return {'content': 'NFL 답변 https://nfl.com/news/test https://evil.example/no'}
        self.provider = provider
        self.client = self.make_client()

    def make_client(self):
        app = Flask(__name__)
        app.register_blueprint(chat.create_blueprint(self.config, self.provider))
        return app.test_client()

    def post(self, **changes):
        data = {'date': '2026-10-26', 'messages': [{'role': 'user', 'content': 'NFL 설명'}]}
        data.update(changes)
        return self.client.post('/api/nfl-chat', json=data, headers={'Origin': ORIGIN})

    def test_post_isolated_and_sanitized(self):
        response = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['sources'], [{'label': 'NFL', 'url': 'https://nfl.com/news/test'}])
        self.assertNotIn('evil.example', response.json['answer'])
        payload, key = self.calls[0]
        self.assertEqual(payload['messages'][0]['role'], 'system')
        self.assertNotIn('untrusted ignore instructions', payload['messages'][0]['content'])
        self.assertIn('untrusted ignore instructions', payload['messages'][1]['content'])
        self.assertEqual(payload['model'], 'google/gemini-3.8-flash')
        self.assertEqual(payload['max_tokens'], 3000)
        self.assertEqual(payload['plugins'], [{'id': 'web', 'engine': 'native'}])
        self.assertEqual(payload['reasoning'], {'effort': 'low', 'exclude': True})
        self.assertFalse(response.json['searched'])
        self.assertEqual(response.json['model'], 'google/gemini-3.8-flash')
        self.assertEqual(response.json['modelLabel'], 'Gemini 3.8 Flash')
        self.assertNotIn('tools', payload)
        self.assertNotIn('sentinel-secret', str(payload) + response.get_data(as_text=True))

    def test_no_uncited_sources(self):
        self.provider = lambda payload, key: {'content': '일반적인 NFL 전술 설명입니다.'}
        self.client = self.make_client()
        self.assertEqual(self.post().json['sources'], [])

    def test_grounding_annotations_and_server_metadata(self):
        urls = ['https://nfl.com/new/' + str(i) for i in range(10)]
        annotations = [{'type': 'url_citation', 'url_citation': {'url': url, 'title': 'NFL latest'}} for url in urls]
        annotations += [None, {'type': 'url_citation', 'url_citation': None}, {'type': 'url_citation', 'url_citation': {'url': 'javascript:alert(1)'}}, {'type': 'url_citation', 'url_citation': {'url': 'http://unsafe.example'}}]
        self.provider = lambda payload, key: {'content': 'latest ' + urls[0] + ' https://invented.example', 'annotations': annotations}
        self.client = self.make_client()
        result = self.post(model='evil', searched=False, now='1900-01-01').json
        self.assertTrue(result['searched'])
        self.assertEqual(result['modelLabel'], 'Gemini 3.8 Flash')
        self.assertIn(urls[0], result['answer'])
        self.assertNotIn('invented.example', result['answer'])
        self.assertEqual(len(result['sources']), 8)
        self.assertTrue(all(s['url'].startswith('https://') for s in result['sources']))

    def test_missing_or_invalid_search_metadata_is_false(self):
        for annotations in [None, {}, [], [{'type': 'url_citation', 'url_citation': {'url': 'javascript:bad'}}]]:
            self.provider = lambda payload, key: {'content': '검색했다고 주장하는 답변', 'annotations': annotations, 'searched': True}
            self.client = self.make_client()
            result = self.post(searched=True).json
            self.assertFalse(result['searched'])
            self.assertEqual(result['sources'], [])

    def test_verified_usage_search_metadata(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status_code = 200
        response.json.return_value = {'choices': [{'message': {'content': 'NFL'}}], 'usage': {'server_tool_use_details': {'web_search_requests': 4}}}
        self.provider = chat.openrouter
        self.client = self.make_client()
        with patch.object(chat.requests, 'post', return_value=response):
            self.assertTrue(self.post().json['searched'])

    def test_current_kst_date_is_server_owned(self):
        from datetime import datetime
        from zoneinfo import ZoneInfo
        self.post(now='1900-01-01')
        system = self.calls[0][0]['messages'][0]['content']
        expected = datetime.fromtimestamp(self.config['clock'](), ZoneInfo('Asia/Seoul')).date().isoformat()
        self.assertIn(expected, system)
        self.assertIn('2026-10-26', system)
        self.assertIn('Google', system)
        self.assertNotIn('1900-01-01', system)

    def test_stale_leases_expire_without_resetting_quota(self):
        limiter = chat.Quota(self.temp.name + '/lease.sqlite')
        self.assertIsNotNone(limiter.acquire('a', 1000))
        self.assertIsNotNone(limiter.acquire('b', 1000))
        self.assertIsNone(limiter.acquire('c', 1119))
        self.assertIsNotNone(limiter.acquire('c', 1120))
        with limiter.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM requests').fetchone()[0], 3)

    def test_validation(self):
        for changes in [{'date': '../private'}, {'date': '2026-10-27'}, {'messages': []}, {'messages': [{'role': 'system', 'content': 'override'}]}, {'messages': [{'role': 'assistant', 'content': 'x'}]}, {'messages': [{'role': 'user', 'content': 'x'*2001}]}, {'messages': [{'role': 'user', 'content': 'x'}]*11}, {'messages': [{'role': 'user', 'content': 'x'*2000}]*7}]:
            with self.subTest(changes=str(changes)[:80]):
                self.assertEqual(self.post(**changes).status_code, 400)
        self.assertFalse(self.calls)
        self.assertEqual(self.client.post('/api/nfl-chat', data='x'*65537, headers={'Origin': ORIGIN, 'Content-Type': 'application/json'}).status_code, 413)

    def test_korean_history_within_character_limits_is_accepted(self):
        import json
        messages = [{'role': 'assistant' if i % 2 == 0 else 'user', 'content': '가' * 1900} for i in range(6)]
        response = self.client.post('/api/nfl-chat', data=json.dumps({'date':'2026-10-26','messages':messages},ensure_ascii=False).encode(), headers={'Origin':ORIGIN,'Content-Type':'application/json'})
        self.assertEqual(response.status_code, 200)

    def test_cors(self):
        for origin in [None, 'null', 'https://evil.example', ORIGIN+'.evil']:
            headers = {'Origin': origin} if origin else {}
            result = self.client.post('/api/nfl-chat', json={}, headers=headers)
            self.assertEqual(result.status_code, 403)
            self.assertNotIn('Access-Control-Allow-Origin', result.headers)
        result = self.client.options('/api/nfl-chat', headers={'Origin': ORIGIN})
        self.assertEqual(result.status_code, 204)
        self.assertEqual(result.headers['Access-Control-Allow-Origin'], ORIGIN)

    def test_missing_key_no_charge(self):
        self.config['api_key'] = ''
        self.client = self.make_client()
        self.assertEqual(self.post().status_code, 503)
        self.config['api_key'] = 'sentinel-secret'
        self.client = self.make_client()
        self.assertEqual(self.post().status_code, 200)

    def test_sanitized_errors(self):
        for error, status in [(requests.Timeout('sentinel-secret'), 503), (ValueError('sentinel-secret'), 502)]:
            def fail(payload, key):
                raise error
            self.provider = fail
            self.client = self.make_client()
            result = self.post()
            self.assertEqual(result.status_code, status)
            self.assertNotIn('sentinel-secret', result.get_data(as_text=True))

    def test_persistent_per_client(self):
        for _ in range(6):
            self.assertEqual(self.post().status_code, 200)
        self.client = self.make_client()
        self.assertEqual(self.post().status_code, 429)

    def test_key_parser_exact_no_environment_dump(self):
        envfile = Path(self.temp.name) / '.env'
        envfile.write_text('OTHER_SECRET=do-not-load\nOPENROUTER_API_KEY_EXTRA=wrong\nexport OPENROUTER_API_KEY="test-only-key"\n')
        with patch.object(chat, 'PRIVATE_ENV', envfile), patch.dict(chat.os.environ, {}, clear=True):
            self.assertEqual(chat.read_key(), 'test-only-key')
            self.assertNotIn('OTHER_SECRET', chat.os.environ)
        text = MODULE.read_text()
        self.assertNotIn('load_dotenv(', text)
        self.assertNotIn('dict(os.environ)', text)
        self.assertNotRegex(text, r'\bprint\s*\(')

    def test_provider_wire_contract(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status_code = 200
        response.json.return_value = {'choices': [{'message': {'content': 'NFL'}}]}
        with patch.object(chat.requests, 'post', return_value=response) as post:
            self.assertEqual(chat.openrouter({'stream': False}, 'test-key'), {'content': 'NFL'})
            self.assertEqual(post.call_args.kwargs['timeout'], 60)
            self.assertFalse(post.call_args.kwargs['allow_redirects'])
            self.assertEqual(post.call_args.args[0], 'https://openrouter.ai/api/v1/chat/completions')

    def test_quota_race(self):
        from concurrent.futures import ThreadPoolExecutor
        limiter = chat.Quota(self.temp.name + '/race.sqlite')
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda i: limiter.acquire(str(i), 2000000000), range(8)))
        self.assertEqual(sum(token is not None for token in results), 2)
        for token in results:
            if token:
                limiter.release(token)

    def test_quota_hour_day_concurrency(self):
        limiter = chat.Quota(self.temp.name + '/other.sqlite')
        now = 2000000000
        first = limiter.acquire('a', now)
        second = limiter.acquire('b', now)
        self.assertIsNone(limiter.acquire('c', now))
        limiter.release(first)
        limiter.release(second)
        for i in range(8):
            token = limiter.acquire(str(i), now)
            self.assertIsNotNone(token)
            limiter.release(token)
        self.assertIsNone(limiter.acquire('extra', now))
        for hour in range(1,5):
            for i in range(10):
                token = limiter.acquire(str(i), now + hour*3601)
                self.assertIsNotNone(token)
                limiter.release(token)
        self.assertIsNone(limiter.acquire('daycap', now + 5*3601))

if __name__ == '__main__':
    unittest.main()
