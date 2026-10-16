import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeHttpsUrl } from '../src/render-utils.js';

test('escapeHtml neutralizes markup and attribute-breaking characters', () => {
  assert.equal(
    escapeHtml('<img src="x" onerror="alert(1)"> & hello'),
    '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt; &amp; hello',
  );
});

test('safeHttpsUrl accepts HTTPS and rejects active or malformed schemes', () => {
  assert.equal(safeHttpsUrl('https://www.nfl.com/news/example'), 'https://www.nfl.com/news/example');
  assert.equal(safeHttpsUrl('javascript:alert(1)'), '#');
  assert.equal(safeHttpsUrl('not a url'), '#');
});