# NFL chat backend

Standalone Flask blueprint; no stock project files are imported or modified. Requires the existing Flask/requests virtualenv and Node (fallback `/opt/homebrew/bin/node`). No paid API calls are made by unit tests.

## Mount before serving requests

```python
import importlib.util
spec = importlib.util.spec_from_file_location(
    'nfl_chat', '/Users/user/projects/nfl-briefing/server/nfl_chat.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app.register_blueprint(module.create_blueprint())
```

**Integration check:** exclude `/api/nfl-chat` from any existing global wildcard CORS middleware; app after-request hooks run after blueprint hooks and must not overwrite its exact allowlist. Keep debug mode off. Do not log Authorization headers or request bodies.

GET `/api/nfl-chat` returns only service health (not key/provider readiness). POST and OPTIONS require an Origin exactly equal to `https://kihong9336.github.io` or `https://payer-junkie-overfull.ngrok-free.dev`. OPTIONS allows Content-Type and ngrok-skip-browser-warning. A CLI smoke test must supply an allowed Origin; do not mistake CORS for authentication.

POST JSON: `{"date":"2026-10-26","messages":[{"role":"user","content":"NFL 규칙을 설명해 주세요"}]}`. Dates must exactly match an edition in `src/data.js`. Body maximum is 20 KiB, 1–10 messages, 2,000 characters each and 12,000 total, user/assistant roles only, ending with user. Unknown per-message fields are dropped, unknown roles rejected. Frontend must clip prior assistant messages to 2,000 characters, reduce history to ten messages and respect UTF-8 body size (Korean characters use multiple bytes). Answers can exceed 2,000 characters; render as text, never raw HTML.

Success: `{answer,sources,date}`. Sources contain only cited HTTP(S) URLs from the selected edition, capped at five. General explanations without citations return an empty list. Errors return only a fixed `error` code: 400 invalid input/edition, 403 origin, 413 body, 429 quota, 503 unavailable key/data/quota or timeout, 502 failed upstream. Provider failures consume quota once a request is reserved, with no automatic retry.

## Secrets and data

The key comes from OPENROUTER_API_KEY in the server environment or the exact OPENROUTER_API_KEY entry in `/Users/user/.hermes/profiles/personal/.env`. The restricted dotenv parser reads only this entry without interpolation or loading other entries into the environment. The key is never added to prompts or returned by health. No key was inspected or printed during implementation.

A fixed Node subprocess loads only the repository's `src/data.js`; request data never enters a command, path, or URL. The subprocess receives a minimal environment without credentials. Curated selected-edition text is bounded to 35,000 characters. There is no live search, filesystem API, agent runtime, user URL fetch, or tool calling. OpenRouter model is fixed to openai/gpt-4.1-mini, max_completion_tokens=1200, temperature=0.3, stream=false, request timeout=60, no redirects/retries. Model availability and real calls are the parent's responsibility.

The Korean system prompt restricts answers to NFL, redirects unrelated questions, forbids investment advice, treats edition and conversation content as untrusted data, and explicitly distinguishes general rules from unverified latest/future facts. Prompt instructions are behavioral controls, not a mathematical guarantee of perfect NFL-only output. No private information other than the API authorization is available to the provider call. Messages and public edition excerpts are sent to OpenRouter; avoid entering private data. Source inclusion verifies provenance, not that a cited article supports every sentence.

## Persistent limits / operational caveats

SQLite: `/Users/user/.hermes/profiles/personal/cache/nfl-chat/quota.sqlite`. Atomic BEGIN IMMEDIATE reservations enforce rolling global 50/24h, 10/hour, per-client 6/minute, and two active provider requests across processes. Requests are charged before upstream calls and persist across restarts. Missing keys do not charge. Counts are not authentication: non-browser clients can forge Origin and consume the public budget. Configure a provider-side spending cap as additional defense.

Client buckets use hashed `request.remote_addr`, deliberately ignoring untrusted forwarding headers. Behind ngrok all users may share one bucket unless trusted proxy configuration is carefully deployed; never blindly trust X-Forwarded-For. Active leases fail closed on process crash instead of being timed out while a paid call might still be running. After stopping **all** worker processes and confirming no calls remain, an operator may reset only stale active flags (`UPDATE requests SET active=0`), preserving request counts. Do not delete the quota database to recover concurrency.

Timeout=60 is the requests connection/read timeout, not a strict overall wall-clock deadline. The active SQLite lease remains held until the request returns. HTTP reverse-proxy request size/time limits are recommended for ingress defense.

## Test

```sh
/Users/user/Projects/stock-discovery-lab/.venv/bin/python -m unittest discover -s /Users/user/projects/nfl-briefing/server -v
```

Tests inject a provider, edition loader, clock, key and temporary SQLite path through `create_blueprint(config=None, provider=None)`. These are trusted in-process test dependencies, never HTTP parameters. Do not expose config overrides in routes.
