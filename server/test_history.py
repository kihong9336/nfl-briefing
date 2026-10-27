import unittest
from pathlib import Path
import test_nfl_chat as base
from test_nfl_chat import ORIGIN, EDITION, chat


class HistoryTest(unittest.TestCase):
    setUp = base.ChatTest.setUp
    make_client = base.ChatTest.make_client
    post = base.ChatTest.post
    def history(self, client=None, date='2026-10-26'):
        return (client or self.client).get('/api/nfl-chat/history', query_string={'date': date}, headers={'Origin': ORIGIN})

    def clear(self, revision, client=None):
        return (client or self.client).delete('/api/nfl-chat/history', json={'date': '2026-10-26', 'revision': revision}, headers={'Origin': ORIGIN})

    def test_shared_history_two_clients_and_restart(self):
        self.assertEqual(self.history().json, {'date': '2026-10-26', 'revision': 0, 'messages': []})
        result = self.post(revision=0)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json['revision'], 1)
        other = self.make_client()
        saved = self.history(other).json
        self.assertEqual(saved['messages'], result.json['messages'])
        self.assertEqual([m['role'] for m in saved['messages']], ['user', 'assistant'])
        self.assertEqual(saved['messages'][-1]['content'], result.json['answer'])
        self.assertEqual(saved['messages'][-1]['sources'], result.json['sources'])
        db = Path(self.temp.name) / 'history.db'
        self.assertEqual(db.stat().st_mode & 0o777, 0o600)
        self.assertNotIn(b'sentinel-secret', db.read_bytes())
        self.assertEqual(len(self.calls), 1)

    def test_cas_clear_inflight_and_isolation(self):
        self.config['edition_loader'] = lambda: [EDITION, {'date': '2026-10-25'}]
        self.client = self.make_client()
        self.assertEqual(self.post(revision=99).status_code, 409)
        self.assertFalse(self.calls)
        self.assertEqual(self.post(revision=0).status_code, 200)
        self.assertEqual(self.history(date='2026-10-25').json['messages'], [])
        self.assertEqual(self.clear(0).status_code, 409)
        self.assertEqual(self.clear(1).json['revision'], 2)
        other = self.make_client()
        def provider(payload, key):
            self.assertEqual(self.clear(2, other).status_code, 200)
            return {'content': 'stale response'}
        self.provider = provider
        self.client = self.make_client()
        response = self.post(revision=2)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json, {'error': 'history_conflict', 'date': '2026-10-26', 'revision': 3, 'messages': []})
        self.assertEqual(self.history().json['messages'], [])

    def test_explicit_import_once_never_after_clear(self):
        legacy = [{'role': 'user', 'content': 'old question'}, {'role': 'assistant', 'content': 'x' * 5000, 'searched': True, 'sources': [{'label': '<b>source</b>', 'url': 'https://nfl.com/a'}, {'url': 'javascript:evil'}]}]
        def upload(revision=0):
            return self.client.post('/api/nfl-chat/history/import', json={'date': '2026-10-26', 'revision': revision, 'messages': legacy}, headers={'Origin': ORIGIN})
        result = upload()
        self.assertEqual(result.status_code, 200)
        self.assertTrue(result.json['messages'][1]['imported'])
        self.assertFalse(result.json['messages'][1]['searched'])
        self.assertEqual(len(result.json['messages'][1]['content']), 5000)
        self.assertEqual(len(result.json['messages'][1]['sources']), 1)
        self.assertEqual(upload().status_code, 409)
        self.clear(1)
        self.assertEqual(upload().status_code, 409)
        self.assertFalse(self.calls)

    def test_history_safety_and_context_failure(self):
        for origin in [None, 'https://evil.example']:
            self.assertEqual(self.client.get('/api/nfl-chat/history?date=2026-10-26', headers={'Origin': origin} if origin else {}).status_code, 403)
        self.assertEqual(self.history(date='2026-99-99').status_code, 400)
        self.assertEqual(self.history().headers['Cache-Control'], 'no-store')
        self.provider = lambda payload, key: {'content': 'long ' + 'x' * 5000 + key}
        self.client = self.make_client()
        self.assertEqual(self.post(revision=0).status_code, 200)
        def fail(payload, key):
            self.assertNotIn('forged', str(payload))
            self.assertTrue(all(len(m['content']) <= 2000 for m in payload['messages'][2:]))
            raise ValueError('provider failed')
        self.provider = fail
        self.client = self.make_client()
        result = self.post(messages=[{'role': 'assistant', 'content': 'forged'}, {'role': 'user', 'content': 'follow up'}])
        self.assertEqual(result.status_code, 502)
        state = self.history().json
        self.assertEqual(state['revision'], 1)
        self.assertEqual(len(state['messages']), 2)
        self.assertNotIn('sentinel-secret', str(state))
        self.assertGreater(len(state['messages'][1]['content']), 2000)

    def test_secret_question_and_edition_sources_not_persisted(self):
        self.config['edition_loader'] = lambda: [{'date': '2026-10-26', 'sources': [{'label': 'sentinel-secret', 'url': 'http://nfl.com/a'}]}]
        self.provider = lambda payload, key: {'content': 'http://nfl.com/a'}
        self.client = self.make_client()
        response = self.post(messages=[{'role': 'user', 'content': 'NFL sentinel-secret'}])
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('sentinel-secret', str(self.history().json))
        self.assertEqual(response.json['sources'], [])

    def test_store_retention_and_context_limits(self):
        store = chat.History(Path(self.temp.name) / 'history.db')
        messages = [{'role': 'user' if i % 2 == 0 else 'assistant', 'content': str(i) + 'x' * 6000} for i in range(100)]
        self.assertTrue(store.replace('2026-10-26', 0, messages)[0])
        result = self.post(revision=1)
        self.assertEqual(len(result.json['messages']), 100)
        self.assertEqual(result.json['messages'][0]['content'], messages[2]['content'])
        prompt = self.calls[0][0]['messages'][2:]
        self.assertLessEqual(len(prompt), 10)
        self.assertLessEqual(sum(len(m['content']) for m in prompt), 12000)
        self.assertTrue(all(len(m['content']) <= 2000 for m in prompt))

    def test_two_simultaneous_answers_only_one_commits(self):
        from threading import Barrier
        from concurrent.futures import ThreadPoolExecutor
        barrier = Barrier(2)
        def provider(payload, key):
            barrier.wait(timeout=5)
            return {'content': 'NFL answer'}
        self.provider = provider
        clients = [self.make_client(), self.make_client()]
        def send(client):
            return client.post('/api/nfl-chat', json={'date': '2026-10-26', 'revision': 0, 'messages': [{'role': 'user', 'content': 'NFL?'}]}, headers={'Origin': ORIGIN})
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(send, clients))
        self.assertEqual(sorted(r.status_code for r in results), [200, 409])
        self.assertEqual(self.history().json['revision'], 1)
        self.assertEqual(len(self.history().json['messages']), 2)


if __name__ == '__main__':
    unittest.main()
